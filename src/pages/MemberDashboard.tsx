import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyContributions, useMyLoans, useMyTransactions,
  useMyGuarantorships, useGroupFinancials, useSettings,
} from "@/hooks/useAppData";

const MemberDashboard = () => {
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
  const availableBalance = gfTotalContributions - gfTotalOutstanding;
  const totalExpected = gfTotalContributions + gfTotalOutstanding * 0.05;

  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle={`Welcome back${profile?.display_name ? `, ${profile.display_name}` : ""} — #${profile?.membership_number || ""}`}
      role="member"
    >
      {/* Guarantor Requests Inbox */}
      <GuarantorRequestsInbox />

      {/* Financial Overview */}
      <div className="mb-8">
        <FinancialOverview
          totalInvestments={gfTotalContributions}
          totalLoansGiven={gfTotalLoansDisbursed}
          totalExpectedAfterLoans={totalExpected}
          availableBalance={availableBalance}
          minimumBalance={minimumBalance}
          interestRate={interestRate}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
          subtitle={loanBalance > 0 ? `+KES ${monthlyInterest.toLocaleString()}/mo interest` : "No active loans"}
          icon={CreditCard}
          variant={loanBalance > 0 ? "warning" : "success"}
        />
        <StatsCard
          title="Available to Borrow"
          value={`KES ${Math.max(0, remainingBorrowingCapacity).toLocaleString()}`}
          subtitle={`Max: KES ${maxLoanEligibility.toLocaleString()}`}
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

      {/* Payment Submission & Loan Request */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {/* Submit Payment Card */}
        <Card variant="bordered" className="bg-gradient-to-r from-success/5 to-success/10">
          <CardContent className="py-6">
            <div className="flex flex-col items-center justify-between gap-4">
              <div className="w-full">
                <h3 className="font-display text-lg font-semibold mb-1">Submit Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Report your M-Pesa payment for verification and posting to your account.
                </p>
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={() => setPaymentModalOpen(true)}
                className="w-full gap-2"
              >
                <FileText className="w-5 h-5" />
                Submit Payment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loan Request Card */}
        {canRequestLoan && !pendingLoan && (
          <Card variant="bordered" className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="py-6">
              <div className="flex flex-col items-center justify-between gap-4">
                <div className="w-full">
                  <h3 className="font-display text-lg font-semibold mb-1">
                    {loanBalance > 0 ? "Need More Funds?" : "Need a Loan?"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You can borrow up to KES {remainingBorrowingCapacity.toLocaleString()} more.
                  </p>
                </div>
                <Button variant="gold" size="lg" onClick={() => setLoanModalOpen(true)} className="w-full gap-2">
                  <Send className="w-5 h-5" />
                  Request Loan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Old Loan Request Section - Keep for pending loan display */}

      {pendingLoan && (
        <div className="mb-8">
          <Card variant="gold">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <AlertCircle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium">Loan Request — {pendingLoan.status.replace("_", " ")}</p>
                  <p className="text-sm text-muted-foreground">
                    KES {Number(pendingLoan.amount).toLocaleString()} — {pendingLoan.status === "pending_guarantors" ? "Waiting for guarantors to respond" : "Awaiting Treasurer approval"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <ProgressCard title="Group Investment Progress" current={gfTotalContributions} target={investmentTarget} />

          {/* Recent Transactions */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Badge variant="secondary">{transactions.length} records</Badge>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${Number(t.amount) > 0 ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
                          {Number(t.amount) > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{t.type.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(t.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold text-lg ${Number(t.amount) > 0 ? "text-success" : "text-accent"}`}>
                        {Number(t.amount) > 0 ? "+" : ""}KES {Math.abs(Number(t.amount)).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Payment Schedule */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Payment Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Contribution</p>
                  <p className="font-display text-xl font-bold">
                    KES {(settings?.minimum_contribution ? Number(settings.minimum_contribution) : 2000).toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-success/5 border border-success/10 text-center">
                    <p className="text-3xl font-display font-bold text-success">{monthsPaid}</p>
                    <p className="text-xs text-muted-foreground mt-1">Months Paid</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted text-center">
                    <p className="text-3xl font-display font-bold">{contributions.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Contributions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loan Calculator */}
          <LoanCalculator />

          {/* Member Financial Summary */}
          <MemberFinancialSummary loanAmount={0} />

          {/* Guarantorships */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                My Guarantorships
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guarantorships.length > 0 ? (
                <div className="space-y-4">
                  {guarantorships.map((g) => (
                    <div key={g.id} className="p-4 rounded-xl bg-muted/50 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">You guaranteed</span>
                        <Badge variant={g.status === "accepted" ? "default" : "secondary"}>{g.status}</Badge>
                      </div>
                      <p className="font-semibold">{g.borrower_name}</p>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Guarantee Amount</span>
                          <span className="font-medium">KES {Number(g.amount).toLocaleString()}</span>
                        </div>
                        {g.loan && (
                          <div className="flex justify-between text-sm mt-1">
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
                  <p>No active guarantorships</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="mb-8">
        <TransactionHistory />
      </div>

      <LoanRequestModal
        open={loanModalOpen}
        onOpenChange={setLoanModalOpen}
        maxLoanAmount={remainingBorrowingCapacity}
        totalSavings={totalSavings}
        currentLoanBalance={loanBalance}
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
