import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Wallet, CreditCard, TrendingUp, AlertCircle, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Users, Calendar, Send, FileText,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ProgressCard from "@/components/dashboard/ProgressCard";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import LoanRequestModal from "@/components/member/LoanRequestModal";
import GuarantorRequestsInbox from "@/components/member/GuarantorRequestsInbox";
import PaymentSubmissionModal from "@/components/member/PaymentSubmissionModal";
import TransactionHistory from "@/components/member/TransactionHistory";
import PaymentHistory from "@/components/member/PaymentHistory";
import MemberFinancialSummary from "@/components/member/MemberFinancialSummary";
import LoanCalculator from "@/components/member/LoanCalculator";
import LoanRepaymentSchedule from "@/components/member/LoanRepaymentSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyContributions, useMyLoans, useMyTransactions,
  useMyGuarantorships, useGroupFinancials, useSettings,
} from "@/hooks/useAppData";

const MemberDashboard = () => {
  const { section } = useParams();
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { profile, user } = useAuth();
  const { data: contributions = [] } = useMyContributions();
  const { data: loans = [] } = useMyLoans();
  const { data: transactions = [] } = useMyTransactions();
  const { data: guarantorships = [] } = useMyGuarantorships();
  const { data: groupFinancials } = useGroupFinancials();
  const { data: settings } = useSettings();

  const totalSavings = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
  const activeLoans = loans.filter((l) => l.status === "disbursed" || l.status === "approved");
  const allActiveOrPendingLoans = loans.filter((l) => 
    ["disbursed", "approved", "pending_approval", "pending_guarantors", "draft"].includes(l.status)
  );
  const loanBalance = activeLoans.reduce((sum, l) => sum + (Number(l.amount) - Number(l.repaid_amount)), 0);
  const monthlyInterest = loanBalance * 0.05;
  const monthsPaid = new Set(contributions.map((c) => c.month)).size;

  const maxLoanEligibility = totalSavings * 5;
  const remainingBorrowingCapacity = maxLoanEligibility - loanBalance;
  const canRequestLoan = remainingBorrowingCapacity > 0;

  const pendingLoan = loans.find(
    (l) => l.status === "pending_guarantors" || l.status === "pending_approval" || l.status === "draft"
  );

  const interestRate = settings?.interest_rate ? Number(settings.interest_rate) : 5;
  const investmentTarget = settings?.investment_target ? Number(settings.investment_target) : 5000000;
  const minimumBalance = settings?.minimum_balance ? Number(settings.minimum_balance) : 50000;

  const gfTotalContributions = groupFinancials?.total_contributions || 0;
  const gfTotalLoansDisbursed = groupFinancials?.total_loans_disbursed || 0;
  const gfTotalOutstanding = groupFinancials?.total_loans_outstanding || 0;
  const gfTotalInterestEarned = groupFinancials?.total_interest_earned || 0;
  const availableBalance = gfTotalContributions - gfTotalOutstanding;
  const totalExpected = gfTotalContributions + (gfTotalOutstanding * (interestRate / 100)) + gfTotalInterestEarned;

  // Section-based rendering
  const currentSection = section || "overview";

  const renderOverview = () => (
    <>
      <GuarantorRequestsInbox />

      <div className="mb-6 lg:mb-8">
        <FinancialOverview
          totalInvestments={gfTotalContributions}
          totalLoansGiven={gfTotalLoansDisbursed}
          totalExpectedAfterLoans={totalExpected}
          availableBalance={availableBalance}
          minimumBalance={minimumBalance}
          interestRate={interestRate}
        />
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6 lg:mb-8">
        <StatsCard
          title="My Savings"
          value={`KES ${totalSavings.toLocaleString()}`}
          subtitle={`${monthsPaid} months paid`}
          icon={Wallet}
          variant="gold"
        />
        <StatsCard
          title="Loan Balance"
          value={`KES ${loanBalance.toLocaleString()}`}
          subtitle={loanBalance > 0 ? `+KES ${monthlyInterest.toLocaleString()}/mo` : "No active loans"}
          icon={CreditCard}
          variant={loanBalance > 0 ? "warning" : "success"}
        />
        <StatsCard
          title="Can Borrow"
          value={`KES ${Math.max(0, remainingBorrowingCapacity).toLocaleString()}`}
          subtitle={`Max: ${maxLoanEligibility.toLocaleString()}`}
          icon={TrendingUp}
          variant={remainingBorrowingCapacity > 0 ? "default" : "warning"}
        />
        <StatsCard
          title="Active Loans"
          value={activeLoans.length.toString()}
          subtitle={activeLoans.length > 0 ? "In repayment" : "No active loans"}
          icon={activeLoans.length > 0 ? AlertCircle : CheckCircle2}
          variant={activeLoans.length > 0 ? "warning" : "success"}
        />
      </div>

      {/* Action Cards */}
      <div className="mb-6 lg:mb-8 grid gap-4 sm:grid-cols-2">
        <Card variant="bordered" className="bg-gradient-to-r from-success/5 to-success/10">
          <CardContent className="py-5 sm:py-6">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-display text-base sm:text-lg font-semibold mb-1">Submit Payment</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Report your M-Pesa payment for verification.
                </p>
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={() => setPaymentModalOpen(true)}
                className="w-full gap-2 text-sm sm:text-base"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                Submit Payment
              </Button>
            </div>
          </CardContent>
        </Card>

        {canRequestLoan && !pendingLoan && (
          <Card variant="bordered" className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="py-5 sm:py-6">
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="font-display text-base sm:text-lg font-semibold mb-1">
                    {loanBalance > 0 ? "Need More Funds?" : "Need a Loan?"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Borrow up to KES {remainingBorrowingCapacity.toLocaleString()}
                    {allActiveOrPendingLoans.length > 0 && (
                      <span className="block text-xs mt-1">({3 - allActiveOrPendingLoans.length} of 3 loan slots remaining)</span>
                    )}
                  </p>
                </div>
                <Button variant="gold" size="lg" onClick={() => setLoanModalOpen(true)} className="w-full gap-2 text-sm sm:text-base">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  Request Loan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {pendingLoan && (
        <div className="mb-6 lg:mb-8">
          <Card variant="gold">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <AlertCircle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Loan Request — {pendingLoan.status.replace("_", " ")}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    KES {Number(pendingLoan.amount).toLocaleString()} — {pendingLoan.status === "pending_guarantors" ? "Waiting for guarantors" : "Awaiting Treasurer approval"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <ProgressCard title="Group Investment Progress" current={gfTotalContributions} target={investmentTarget} />

          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
              <Badge variant="secondary">{transactions.length}</Badge>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${Number(t.amount) > 0 ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
                          {Number(t.amount) > 0 ? <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base capitalize truncate">{t.type.replace(/_/g, " ")}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold text-sm sm:text-lg shrink-0 ${Number(t.amount) > 0 ? "text-success" : "text-accent"}`}>
                        {Number(t.amount) > 0 ? "+" : ""}KES {Math.abs(Number(t.amount)).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="w-5 h-5 text-accent" />
                Payment Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Monthly Contribution</p>
                  <p className="font-display text-lg sm:text-xl font-bold">
                    KES {(settings?.minimum_contribution ? Number(settings.minimum_contribution) : 2000).toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-xl bg-success/5 border border-success/10 text-center">
                    <p className="text-2xl sm:text-3xl font-display font-bold text-success">{monthsPaid}</p>
                    <p className="text-xs text-muted-foreground mt-1">Months Paid</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-muted text-center">
                    <p className="text-2xl sm:text-3xl font-display font-bold">{contributions.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Contributions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <LoanCalculator />
          <MemberFinancialSummary loanAmount={0} />
        </div>
      </div>
    </>
  );

  const renderInvestments = () => (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 mb-6">
        <StatsCard title="Total Savings" value={`KES ${totalSavings.toLocaleString()}`} subtitle={`${monthsPaid} months`} icon={Wallet} variant="gold" />
        <StatsCard title="Monthly Contribution" value={`KES ${(settings?.minimum_contribution ? Number(settings.minimum_contribution) : 2000).toLocaleString()}`} subtitle="Per month" icon={Calendar} variant="default" />
        <StatsCard title="Contributions" value={contributions.length.toString()} subtitle="Total payments" icon={CheckCircle2} variant="success" />
      </div>

      <Card variant="bordered" className="bg-gradient-to-r from-success/5 to-success/10">
        <CardContent className="py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base sm:text-lg font-semibold mb-1">Submit Payment</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Report your M-Pesa payment for verification.</p>
            </div>
            <Button variant="default" size="lg" onClick={() => setPaymentModalOpen(true)} className="w-full sm:w-auto gap-2">
              <FileText className="w-5 h-5" /> Submit Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProgressCard title="Group Investment Progress" current={gfTotalContributions} target={investmentTarget} />
      <PaymentHistory />
      <MemberFinancialSummary loanAmount={0} />
    </div>
  );

  const renderLoans = () => (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard title="Loan Balance" value={`KES ${loanBalance.toLocaleString()}`} subtitle={loanBalance > 0 ? `+KES ${monthlyInterest.toLocaleString()}/mo` : "No loans"} icon={CreditCard} variant={loanBalance > 0 ? "warning" : "success"} />
        <StatsCard title="Can Borrow" value={`KES ${Math.max(0, remainingBorrowingCapacity).toLocaleString()}`} subtitle={`Max: ${maxLoanEligibility.toLocaleString()}`} icon={TrendingUp} variant="default" />
        <StatsCard title="Active Loans" value={activeLoans.length.toString()} subtitle={`${3 - allActiveOrPendingLoans.length} slots left`} icon={AlertCircle} variant={activeLoans.length > 0 ? "warning" : "success"} />
        <StatsCard title="Total Loans" value={allActiveOrPendingLoans.length.toString()} subtitle="Max 3 allowed" icon={FileText} variant={allActiveOrPendingLoans.length >= 3 ? "danger" : "default"} />
      </div>

      {canRequestLoan && !pendingLoan && allActiveOrPendingLoans.length < 3 && (
        <Card variant="bordered" className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base sm:text-lg font-semibold mb-1">Request a Loan</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Borrow up to KES {remainingBorrowingCapacity.toLocaleString()}</p>
              </div>
              <Button variant="gold" size="lg" onClick={() => setLoanModalOpen(true)} className="w-full sm:w-auto gap-2">
                <Send className="w-5 h-5" /> Request Loan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pendingLoan && (
        <Card variant="gold">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base">Loan Request — {pendingLoan.status.replace("_", " ")}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  KES {Number(pendingLoan.amount).toLocaleString()} — {pendingLoan.status === "pending_guarantors" ? "Waiting for guarantors" : "Awaiting approval"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <LoanRepaymentSchedule />
      <LoanCalculator />
    </div>
  );

  const renderGuarantorship = () => (
    <div className="space-y-6 lg:space-y-8">
      <GuarantorRequestsInbox />

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="w-5 h-5 text-primary" />
            My Guarantorships
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guarantorships.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 max-h-[500px] overflow-y-auto">
              {guarantorships.map((g) => (
                <div key={g.id} className="p-3 sm:p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">You guaranteed</span>
                    <Badge variant={g.status === "accepted" ? "default" : "secondary"} className="text-xs">{g.status}</Badge>
                  </div>
                  <p className="font-semibold text-sm sm:text-base">{g.borrower_name}</p>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Guarantee Amount</span>
                      <span className="font-medium">KES {Number(g.amount).toLocaleString()}</span>
                    </div>
                    {g.loan && (
                      <div className="flex justify-between text-xs sm:text-sm mt-1">
                        <span className="text-muted-foreground">Loan Amount</span>
                        <span className="font-medium">KES {Number(g.loan.amount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No active guarantorships</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6 lg:space-y-8">
      <TransactionHistory />
      <PaymentHistory />
    </div>
  );

  const renderContent = () => {
    switch (currentSection) {
      case "investments": return renderInvestments();
      case "loans": return renderLoans();
      case "guarantorship": return renderGuarantorship();
      case "transactions": return renderTransactions();
      default: return renderOverview();
    }
  };

  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle={`Welcome back${profile?.display_name ? `, ${profile.display_name}` : ""} — #${profile?.membership_number || ""}`}
      role="member"
    >
      {renderContent()}

      <LoanRequestModal
        open={loanModalOpen}
        onOpenChange={setLoanModalOpen}
        maxLoanAmount={remainingBorrowingCapacity}
        totalSavings={totalSavings}
        currentLoanBalance={loanBalance}
        totalLoansCount={allActiveOrPendingLoans.length}
      />

      <PaymentSubmissionModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        monthlyContribution={2000}
      />
    </DashboardLayout>
  );
};

export default MemberDashboard;
