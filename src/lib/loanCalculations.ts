/**
 * Loan Calculation Utilities
 * Handles all loan-related calculations and validations
 */

import { supabase } from "@/integrations/supabase/client";

export interface MemberFinancials {
  totalSavings: number;
  activeLoanBalance: number;
  existingGuarantees: number;
  interestRate: number;
  minimumBalance: number;
}

export interface LoanEligibilityData {
  maximumLoanEligible: number;
  selfGuaranteeLimit: number;
  amountRequiringGuarantors: number;
  isSelfGuaranteeAvailable: boolean;
  estimatedInterest: number;
  estimatedTotalRepayment: number;
}

/**
 * Get total savings for a member
 * Query: SELECT COALESCE(SUM(amount),0) FROM contributions WHERE member_id = user_id
 */
export const getMemberTotalSavings = async (
  memberId: string
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("contributions")
      .select("amount")
      .eq("member_id", memberId);

    if (error) {
      console.error("Error fetching savings:", error);
      return 0;
    }

    return data?.reduce((sum, contrib) => sum + (contrib.amount || 0), 0) || 0;
  } catch (error) {
    console.error("Error in getMemberTotalSavings:", error);
    return 0;
  }
};

/**
 * Get active loan balance for a member
 * Sum of all non-repaid loans
 */
export const getMemberActiveLoanBalance = async (
  memberId: string
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("loans")
      .select("amount, repaid_amount")
      .eq("member_id", memberId)
      .in("status", ["approved", "disbursed"]);

    if (error) {
      console.error("Error fetching active loans:", error);
      return 0;
    }

    return (
      data?.reduce(
        (sum, loan) => sum + ((loan.amount || 0) - (loan.repaid_amount || 0)),
        0
      ) || 0
    );
  } catch (error) {
    console.error("Error in getMemberActiveLoanBalance:", error);
    return 0;
  }
};

/**
 * Get existing guarantees for a member
 * Sum of all pending and accepted guarantees
 */
export const getMemberExistingGuarantees = async (
  memberId: string
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("loan_guarantors")
      .select("amount, status")
      .eq("guarantor_id", memberId)
      .in("status", ["pending", "accepted"]);

    if (error) {
      console.error("Error fetching guarantees:", error);
      return 0;
    }

    return data?.reduce((sum, guarantee) => sum + (guarantee.amount || 0), 0) || 0;
  } catch (error) {
    console.error("Error in getMemberExistingGuarantees:", error);
    return 0;
  }
};

/**
 * Get settings (interest rate, minimum balance, etc.)
 */
export const getSystemSettings = async () => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("interest_rate, minimum_balance")
      .single();

    if (error) {
      console.error("Error fetching settings:", error);
      return { interestRate: 5, minimumBalance: 50000 };
    }

    return {
      interestRate: data?.interest_rate || 5,
      minimumBalance: data?.minimum_balance || 50000,
    };
  } catch (error) {
    console.error("Error in getSystemSettings:", error);
    return { interestRate: 5, minimumBalance: 50000 };
  }
};

/**
 * Get all financial data for a member
 */
export const getMemberFinancials = async (
  memberId: string
): Promise<MemberFinancials> => {
  const [totalSavings, activeLoanBalance, existingGuarantees, settings] =
    await Promise.all([
      getMemberTotalSavings(memberId),
      getMemberActiveLoanBalance(memberId),
      getMemberExistingGuarantees(memberId),
      getSystemSettings(),
    ]);

  return {
    totalSavings,
    activeLoanBalance,
    existingGuarantees,
    interestRate: settings.interestRate,
    minimumBalance: settings.minimumBalance,
  };
};

/**
 * Calculate self-guarantee eligibility
 * Self Guarantee Available = Savings - 5000 (safety buffer) - Interest Amount
 * Loan ≤ (Total Member Savings − 5000 − Total Loan Interest)
 */
export const calculateSelfGuaranteeLimit = (
  totalSavings: number,
  loanAmount: number,
  interestRate: number
): { limit: number; isEligible: boolean; estimatedInterest: number } => {
  const SAFETY_BUFFER = 5000;
  const estimatedInterest = (loanAmount * interestRate) / 100;
  const limit = totalSavings - SAFETY_BUFFER - estimatedInterest;
  const isEligible = loanAmount <= limit;

  return {
    limit: Math.max(0, limit),
    isEligible,
    estimatedInterest,
  };
};

/**
 * Calculate maximum loan eligible
 * Maximum = 5 × Member Savings
 */
export const calculateMaximumLoanEligible = (totalSavings: number): number => {
  return totalSavings * 5;
};

/**
 * Get guarantor available capacity
 * Available Capacity = Member Savings − Active Loans − Existing Guarantees
 */
export const calculateGuarantorCapacity = (
  guarantorSavings: number,
  guarantorActiveLoanBalance: number,
  guarantorExistingGuarantees: number
): number => {
  const capacity =
    guarantorSavings -
    guarantorActiveLoanBalance -
    guarantorExistingGuarantees;
  return Math.max(0, capacity);
};

/**
 * Validate guarantor can guarantee the amount
 */
export const validateGuarantorCapacity = (
  guarantorCapacity: number,
  requestedGuaranteeAmount: number
): { isValid: boolean; message: string } => {
  if (requestedGuaranteeAmount <= 0) {
    return { isValid: false, message: "Guarantee amount must be greater than 0" };
  }

  if (requestedGuaranteeAmount > guarantorCapacity) {
    return {
      isValid: false,
      message: `Guarantor does not have sufficient savings to guarantee this amount. Available capacity: KES ${guarantorCapacity.toLocaleString()}`,
    };
  }

  return { isValid: true, message: "Guarantor has sufficient capacity" };
};

/**
 * Calculate loan eligibility data
 */
export const calculateLoanEligibility = (
  loanAmount: number,
  financials: MemberFinancials
): LoanEligibilityData => {
  const maximumLoanEligible = calculateMaximumLoanEligible(financials.totalSavings);
  const selfGuaranteeData = calculateSelfGuaranteeLimit(
    financials.totalSavings,
    loanAmount,
    financials.interestRate
  );

  const amountRequiringGuarantors = Math.max(
    0,
    loanAmount - selfGuaranteeData.limit
  );

  const estimatedTotalRepayment =
    loanAmount + selfGuaranteeData.estimatedInterest;

  return {
    maximumLoanEligible,
    selfGuaranteeLimit: selfGuaranteeData.limit,
    amountRequiringGuarantors,
    isSelfGuaranteeAvailable: selfGuaranteeData.isEligible,
    estimatedInterest: selfGuaranteeData.estimatedInterest,
    estimatedTotalRepayment,
  };
};

/**
 * Validate all loan eligibility rules before approval
 */
export const validateLoanEligibility = (
  loanAmount: number,
  financials: MemberFinancials,
  totalGuaranteeAmount: number,
  currentBankBalance: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Rule 1: Loan ≤ 5 × Member Savings
  const maxEligible = calculateMaximumLoanEligible(financials.totalSavings);
  if (loanAmount > maxEligible) {
    errors.push(
      `Loan amount exceeds maximum eligibility of KES ${maxEligible.toLocaleString()} (5× savings)`
    );
  }

  // Rule 2: Self-guarantee rule or guarantors cover deficit
  const selfGuaranteeData = calculateSelfGuaranteeLimit(
    financials.totalSavings,
    loanAmount,
    financials.interestRate
  );

  const amountRequiringGuarantors = Math.max(
    0,
    loanAmount - selfGuaranteeData.limit
  );

  if (amountRequiringGuarantors > 0 && totalGuaranteeAmount < amountRequiringGuarantors) {
    errors.push(
      `Insufficient guarantees. Required: KES ${amountRequiringGuarantors.toLocaleString()}, Got: KES ${totalGuaranteeAmount.toLocaleString()}`
    );
  }

  // Rule 3: Bank balance after issuing loan must remain ≥ minimum balance
  const balanceAfterDisbursement = currentBankBalance - loanAmount;
  if (balanceAfterDisbursement < financials.minimumBalance) {
    errors.push(
      `Bank balance would fall below minimum of KES ${financials.minimumBalance.toLocaleString()}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get bank balance from transactions
 */
export const getBankBalance = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.from("transactions").select("type, amount");

    if (error) {
      console.error("Error fetching transactions:", error);
      return 0;
    }

    return (
      data?.reduce((balance, transaction) => {
        switch (transaction.type) {
          case "contribution":
          case "loan_repayment":
          case "interest_payment":
            return balance + (transaction.amount || 0);
          case "loan_disbursement":
          case "processing_fee":
            return balance - (transaction.amount || 0);
          default:
            return balance;
        }
      }, 0) || 0
    );
  } catch (error) {
    console.error("Error in getBankBalance:", error);
    return 0;
  }
};

/**
 * Create a guarantee request notification
 */
export const createGuarantorNotification = async (
  guarantorId: string,
  borrowerName: string,
  loanAmount: number,
  guaranteeAmount: number
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: guarantorId,
      type: "guarantor_request",
      title: "Guarantee Request",
      message: `${borrowerName} is requesting KES ${guaranteeAmount.toLocaleString()} as guarantee for a loan of KES ${loanAmount.toLocaleString()}`,
      data: {
        borrowerName,
        loanAmount,
        guaranteeAmount,
      },
    });

    if (error) {
      console.error("Error creating notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in createGuarantorNotification:", error);
    return false;
  }
};

/**
 * Create a loan status notification
 */
export const createLoanNotification = async (
  memberId: string,
  type: "loan_approved" | "loan_rejected" | "loan_disbursed" | "guarantor_accepted" | "guarantor_declined",
  loanAmount: number,
  message: string
): Promise<boolean> => {
  try {
    const titleMap = {
      loan_approved: "Loan Approved",
      loan_rejected: "Loan Rejected",
      loan_disbursed: "Loan Disbursed",
      guarantor_accepted: "Guarantee Accepted",
      guarantor_declined: "Guarantee Declined",
    };

    const { error } = await supabase.from("notifications").insert({
      user_id: memberId,
      type,
      title: titleMap[type],
      message,
      data: {
        loanAmount,
      },
    });

    if (error) {
      console.error("Error creating notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in createLoanNotification:", error);
    return false;
  }
};
