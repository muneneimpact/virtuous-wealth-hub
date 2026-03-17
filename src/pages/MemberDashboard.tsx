import { useState } from "react";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Calendar,
  Send,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ProgressCard from "@/components/dashboard/ProgressCard";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import LoanRequestModal from "@/components/member/LoanRequestModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MemberDashboard = () => {
  const [loanModalOpen, setLoanModalOpen] = useState(false);

  // Mock data - will be replaced with real data from backend
  const memberData = {
    id: 1,
    name: "John Mwangi",
    totalInvested: 28000,
    monthlyContribution: 2000,
    monthsPaid: 14,
    monthsUnpaid: 0,
    arrears: 0,
    loanBalance: 15000,
    loanInterest: 750,
    repaymentProgress: 65,
  };

  // Loan eligibility: 5x contribution minus existing loans
  const maxLoanEligibility = memberData.totalInvested * 5;
  const remainingBorrowingCapacity = maxLoanEligibility - memberData.loanBalance;
  const canRequestLoan = remainingBorrowingCapacity > 0;

  // All members for guarantor selection
  const allMembers = [
    { id: 1, name: "John Mwangi", totalInvested: 28000, loanBalance: 15000 },
    { id: 2, name: "Mary Wanjiku", totalInvested: 32000, loanBalance: 0 },
    { id: 3, name: "James Kamau", totalInvested: 26000, loanBalance: 25000 },
    { id: 4, name: "Grace Akinyi", totalInvested: 30000, loanBalance: 20000 },
    { id: 5, name: "Peter Ochieng", totalInvested: 28000, loanBalance: 0 },
    { id: 6, name: "Susan Njeri", totalInvested: 24000, loanBalance: 10000 },
  ];

  // Group financial data
  const groupFinancials = {
    totalInvestments: 168000,
    totalLoansGiven: 70000,
    totalExpectedAfterLoans: 168000 + (70000 * 0.05), // Principal + 5% interest
    availableBalance: 98000, // totalInvestments - totalLoansGiven
    minimumBalance: 50000,
    interestRate: 5,
  };

  const transactions = [
    { id: 1, type: "contribution", amount: 2000, date: "2024-12-01", status: "completed" },
    { id: 2, type: "loan_repayment", amount: 3000, date: "2024-11-28", status: "completed" },
    { id: 3, type: "contribution", amount: 2000, date: "2024-11-01", status: "completed" },
    { id: 4, type: "loan_disbursement", amount: -20000, date: "2024-10-15", status: "completed" },
    { id: 5, type: "contribution", amount: 2000, date: "2024-10-01", status: "completed" },
  ];

  const guarantorships = [
    {
      id: 1,
      type: "given",
      member: "James Kamau",
      loanAmount: 30000,
      remaining: 12000,
      status: "active",
    },
  ];

  const pendingLoanRequest = null; // Will show if member has pending request

  const handleLoanRequest = (request: { amount: number; guarantors: any[] }) => {
    console.log("Loan request submitted:", request);
    // This would send to backend
  };

  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle="Welcome back, here's your investment summary"
      role="member"
    >
      {/* Financial Overview - Visible to all members */}
      <div className="mb-8">
        <FinancialOverview
          totalInvestments={groupFinancials.totalInvestments}
          totalLoansGiven={groupFinancials.totalLoansGiven}
          totalExpectedAfterLoans={groupFinancials.totalExpectedAfterLoans}
          availableBalance={groupFinancials.availableBalance}
          minimumBalance={groupFinancials.minimumBalance}
          interestRate={groupFinancials.interestRate}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="My Savings"
          value={`KES ${memberData.totalInvested.toLocaleString()}`}
          subtitle={`${memberData.monthsPaid} months paid`}
          icon={Wallet}
          variant="gold"
          trend={{ value: 7.2, isPositive: true }}
        />
        <StatsCard
          title="Loan Balance"
          value={`KES ${memberData.loanBalance.toLocaleString()}`}
          subtitle={`+KES ${memberData.loanInterest}/mo interest`}
          icon={CreditCard}
          variant={memberData.loanBalance > 0 ? "warning" : "success"}
        />
        <StatsCard
          title="Available to Borrow"
          value={`KES ${remainingBorrowingCapacity.toLocaleString()}`}
          subtitle={`Max: KES ${maxLoanEligibility.toLocaleString()}`}
          icon={TrendingUp}
          variant={remainingBorrowingCapacity > 0 ? "default" : "warning"}
        />
        <StatsCard
          title="Arrears"
          value={memberData.arrears > 0 ? `KES ${memberData.arrears.toLocaleString()}` : "None"}
          subtitle={memberData.arrears > 0 ? "Payment required" : "All payments up to date"}
          icon={memberData.arrears > 0 ? AlertCircle : CheckCircle2}
          variant={memberData.arrears > 0 ? "danger" : "success"}
        />
      </div>

      {/* Request Loan Button */}
      {canRequestLoan && (
        <div className="mb-8">
          <Card variant="bordered" className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-semibold mb-1">
                    {memberData.loanBalance > 0 ? "Need More Funds?" : "Need a Loan?"}
                  </h3>
                  <p className="text-muted-foreground">
                    You can borrow up to KES {remainingBorrowingCapacity.toLocaleString()} more
                    {memberData.loanBalance > 0 && ` (Current loan: KES ${memberData.loanBalance.toLocaleString()})`}. 
                    Select guarantors who agreed to back your loan.
                  </p>
                </div>
                <Button variant="gold" size="lg" onClick={() => setLoanModalOpen(true)}>
                  <Send className="w-5 h-5 mr-2" />
                  Request Loan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Loan Request Status */}
      {pendingLoanRequest && (
        <div className="mb-8">
          <Card variant="gold">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <AlertCircle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium">Loan Request Pending</p>
                  <p className="text-sm text-muted-foreground">
                    Your loan request is awaiting Treasurer approval
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Group Progress */}
          <ProgressCard
            title="Group Investment Progress"
            current={groupFinancials.totalInvestments}
            target={2000000}
          />

          {/* Recent Transactions */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Badge variant="secondary">{transactions.length} this month</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2.5 rounded-xl ${
                          transaction.amount > 0
                            ? "bg-success/10 text-success"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {transaction.amount > 0 ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">
                          {transaction.type.replace("_", " ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold text-lg ${
                          transaction.amount > 0 ? "text-success" : "text-accent"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}KES{" "}
                        {Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <Badge
                        variant={transaction.status === "completed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Payment Schedule */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Payment Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Next Payment Due</p>
                  <p className="font-display text-xl font-bold">January 1, 2025</p>
                  <p className="text-accent font-semibold mt-2">
                    KES {memberData.monthlyContribution.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-success/5 border border-success/10 text-center">
                    <p className="text-3xl font-display font-bold text-success">{memberData.monthsPaid}</p>
                    <p className="text-xs text-muted-foreground mt-1">Months Paid</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted text-center">
                    <p className="text-3xl font-display font-bold text-muted-foreground">
                      {memberData.monthsUnpaid}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Unpaid</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guarantorship */}
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
                        <span className="text-sm text-muted-foreground">
                          {g.type === "given" ? "You guaranteed" : "Guaranteed by"}
                        </span>
                        <Badge variant={g.status === "active" ? "default" : "secondary"}>
                          {g.status}
                        </Badge>
                      </div>
                      <p className="font-semibold">{g.member}</p>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Loan Amount</span>
                          <span className="font-medium">KES {g.loanAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className="text-warning font-medium">
                            KES {g.remaining.toLocaleString()}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-success rounded-full"
                            style={{ width: `${((g.loanAmount - g.remaining) / g.loanAmount) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {(((g.loanAmount - g.remaining) / g.loanAmount) * 100).toFixed(0)}% repaid
                        </p>
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

      {/* Loan Request Modal */}
      <LoanRequestModal
        open={loanModalOpen}
        onOpenChange={setLoanModalOpen}
        currentMember={{
          id: memberData.id,
          name: memberData.name,
          totalInvested: memberData.totalInvested,
          loanBalance: memberData.loanBalance,
        }}
        allMembers={allMembers}
        onSubmitRequest={handleLoanRequest}
      />
    </DashboardLayout>
  );
};

export default MemberDashboard;
