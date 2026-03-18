import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, TrendingUp, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMemberFinancials,
  calculateMaximumLoanEligible,
  calculateSelfGuaranteeLimit,
  LoanEligibilityData,
  MemberFinancials,
} from "@/lib/loanCalculations";

interface MemberFinancialSummaryProps {
  loanAmount?: number;
  onDataReady?: (data: LoanEligibilityData) => void;
}

export const MemberFinancialSummary = ({
  loanAmount = 0,
  onDataReady,
}: MemberFinancialSummaryProps) => {
  const { user } = useAuth();
  const [financials, setFinancials] = useState<MemberFinancials | null>(null);
  const [eligibilityData, setEligibilityData] = useState<LoanEligibilityData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinancials = async () => {
      if (!user?.id) return;

      try {
        const data = await getMemberFinancials(user.id);
        setFinancials(data);

        if (loanAmount > 0) {
          const maxEligible = calculateMaximumLoanEligible(data.totalSavings);
          const selfGuaranteeData = calculateSelfGuaranteeLimit(
            data.totalSavings,
            loanAmount,
            data.interestRate
          );

          const eligibility: LoanEligibilityData = {
            maximumLoanEligible: maxEligible,
            selfGuaranteeLimit: selfGuaranteeData.limit,
            amountRequiringGuarantors: Math.max(0, loanAmount - selfGuaranteeData.limit),
            isSelfGuaranteeAvailable: selfGuaranteeData.isEligible,
            estimatedInterest: selfGuaranteeData.estimatedInterest,
            estimatedTotalRepayment: loanAmount + selfGuaranteeData.estimatedInterest,
          };

          setEligibilityData(eligibility);
          onDataReady?.(eligibility);
        }
      } catch (error) {
        console.error("Error loading financials:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFinancials();
  }, [user?.id, loanAmount, onDataReady]);

  if (loading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Member Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!financials) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Member Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Unable to load financial data
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxEligible = calculateMaximumLoanEligible(financials.totalSavings);

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-accent" />
          Member Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Savings Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5">
            <p className="text-sm text-muted-foreground mb-1">Total Savings</p>
            <p className="text-2xl font-bold text-accent">
              KES {financials.totalSavings.toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <p className="text-sm text-muted-foreground mb-1">Maximum Loan Eligible</p>
            <p className="text-2xl font-bold text-blue-600">
              KES {maxEligible.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">5× your savings</p>
          </div>
        </div>

        {/* Interest Rate and Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground mb-1">Interest Rate</p>
            <p className="text-2xl font-bold">{financials.interestRate}%</p>
          </div>

          <div className="p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground mb-1">Active Loan Balance</p>
            <p className="text-2xl font-bold">
              KES {financials.activeLoanBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Loan Request Analysis */}
        {loanAmount > 0 && eligibilityData && (
          <div className="space-y-4 p-4 rounded-xl bg-muted/30">
            <h3 className="font-semibold text-sm">Loan Request Analysis</h3>

            <div className="space-y-3">
              {/* Self Guarantee Status */}
              <div className="flex items-start gap-3">
                {eligibilityData.isSelfGuaranteeAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {eligibilityData.isSelfGuaranteeAvailable
                      ? "Self Guarantee Available"
                      : "Guarantors Required"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Self Guarantee Limit: KES{" "}
                    {eligibilityData.selfGuaranteeLimit.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Estimated Interest */}
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Estimated Interest</p>
                  <p className="text-lg font-bold text-blue-600">
                    KES {eligibilityData.estimatedInterest.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Total Repayment */}
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Estimated Total Repayment</p>
                <p className="text-xl font-bold">
                  KES {eligibilityData.estimatedTotalRepayment.toLocaleString()}
                </p>
              </div>

              {/* Coverage Progress */}
              {eligibilityData.amountRequiringGuarantors > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-medium">Loan Coverage Breakdown</p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Self-Guaranteed</span>
                      <span className="font-medium">
                        KES {eligibilityData.selfGuaranteeLimit.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={
                        (eligibilityData.selfGuaranteeLimit /
                          (eligibilityData.selfGuaranteeLimit +
                            eligibilityData.amountRequiringGuarantors)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Guarantors Required</span>
                      <Badge variant="outline">
                        KES {eligibilityData.amountRequiringGuarantors.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Existing Guarantees */}
        {financials.existingGuarantees > 0 && (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <p className="text-xs text-muted-foreground">Existing Guarantees</p>
            <p className="text-lg font-semibold text-orange-600">
              KES {financials.existingGuarantees.toLocaleString()}
            </p>
          </div>
        )}

        {/* Minimum Balance Info */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs">
          <p className="text-blue-900">
            The system ensures your group's bank account never falls below KES{" "}
            {financials.minimumBalance.toLocaleString()}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberFinancialSummary;
