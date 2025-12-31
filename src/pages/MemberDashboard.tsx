import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ProgressCard from "@/components/dashboard/ProgressCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MemberDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login");
      return;
    }
    const userData = JSON.parse(user);
    if (userData.role !== "member") {
      navigate(`/${userData.role === "admin" ? "admin" : "treasurer"}`);
    }
  }, [navigate]);

  // Mock data - will be replaced with real data from backend
  const memberData = {
    totalInvested: 28000,
    monthlyContribution: 2000,
    monthsPaid: 14,
    monthsUnpaid: 0,
    arrears: 0,
    loanBalance: 15000,
    loanInterest: 750,
    loanEligibility: 50000,
    repaymentProgress: 65,
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

  const groupProgress = {
    current: 280000,
    target: 2000000,
  };

  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle="Welcome back, here's your investment summary"
      role="member"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Invested"
          value={`KES ${memberData.totalInvested.toLocaleString()}`}
          subtitle={`${memberData.monthsPaid} months paid`}
          icon={Wallet}
          variant="gold"
          trend={{ value: 7.2, isPositive: true }}
        />
        <StatsCard
          title="Loan Balance"
          value={`KES ${memberData.loanBalance.toLocaleString()}`}
          subtitle={`+KES ${memberData.loanInterest} interest`}
          icon={CreditCard}
          variant={memberData.loanBalance > 0 ? "warning" : "success"}
        />
        <StatsCard
          title="Loan Eligibility"
          value={`KES ${memberData.loanEligibility.toLocaleString()}`}
          subtitle="Maximum you can borrow"
          icon={TrendingUp}
          variant="default"
        />
        <StatsCard
          title="Arrears"
          value={memberData.arrears > 0 ? `KES ${memberData.arrears.toLocaleString()}` : "None"}
          subtitle={memberData.arrears > 0 ? "Payment required" : "All payments up to date"}
          icon={memberData.arrears > 0 ? AlertCircle : CheckCircle2}
          variant={memberData.arrears > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Group Progress */}
          <ProgressCard
            title="Group Investment Progress"
            current={groupProgress.current}
            target={groupProgress.target}
          />

          {/* Recent Transactions */}
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Badge variant="secondary">{transactions.length} this month</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${
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
                        className={`font-semibold ${
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
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Payment Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Next Payment Due</p>
                  <p className="font-display text-xl font-bold">January 1, 2025</p>
                  <p className="text-accent font-semibold mt-2">
                    KES {memberData.monthlyContribution.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold text-success">{memberData.monthsPaid}</p>
                    <p className="text-xs text-muted-foreground">Months Paid</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold text-muted-foreground">
                      {memberData.monthsUnpaid}
                    </p>
                    <p className="text-xs text-muted-foreground">Unpaid</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guarantorship */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Guarantorship
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guarantorships.length > 0 ? (
                <div className="space-y-4">
                  {guarantorships.map((g) => (
                    <div key={g.id} className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          {g.type === "given" ? "You guaranteed" : "Guaranteed by"}
                        </span>
                        <Badge variant={g.status === "active" ? "default" : "secondary"}>
                          {g.status}
                        </Badge>
                      </div>
                      <p className="font-medium">{g.member}</p>
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="text-muted-foreground">Loan: KES {g.loanAmount.toLocaleString()}</span>
                        <span className="text-warning">
                          Remaining: KES {g.remaining.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No active guarantorships
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MemberDashboard;
