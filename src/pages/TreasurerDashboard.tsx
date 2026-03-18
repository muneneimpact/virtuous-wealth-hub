import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Wallet, Users, CreditCard, TrendingUp, AlertTriangle,
  Search, MoreHorizontal, ArrowUpRight, DollarSign, Download,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ProgressCard from "@/components/dashboard/ProgressCard";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import MemberUpdateModal from "@/components/treasurer/MemberUpdateModal";
import SettingsPanel from "@/components/treasurer/SettingsPanel";
import PendingLoanRequests from "@/components/treasurer/PendingLoanRequests";
import LoanApprovalModal from "@/components/treasurer/LoanApprovalModal";
import PaymentApprovalsPanel from "@/components/treasurer/PaymentApprovalsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGroupFinancials, useSettings, useMemberFinancials,
  usePendingLoans, useAllTransactions, useAllContributions,
} from "@/hooks/useAppData";
import { exportToCSV } from "@/lib/exportReports";
import { useQueryClient } from "@tanstack/react-query";

interface SelectedMember {
  user_id: string;
  display_name: string;
  email: string | null;
  membership_number: string | null;
  totalInvested: number;
  loanBalance: number;
  arrears: number;
  status: string;
}

const TreasurerDashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const { data: groupFinancials } = useGroupFinancials();
  const { data: settings } = useSettings();
  const { data: memberFinancials = [] } = useMemberFinancials();
  const { data: pendingLoans = [] } = usePendingLoans();
  const { data: recentTransactions = [] } = useAllTransactions();
  const { data: allContributions = [] } = useAllContributions();

  const isSettingsPage = location.pathname === "/treasurer/settings";

  const interestRate = settings?.interest_rate ? Number(settings.interest_rate) : 5;
  const investmentTarget = settings?.investment_target ? Number(settings.investment_target) : 5000000;
  const minimumBalance = settings?.minimum_balance ? Number(settings.minimum_balance) : 50000;

  const gfTotal = groupFinancials?.total_contributions || 0;
  const gfLoans = groupFinancials?.total_loans_disbursed || 0;
  const gfOutstanding = groupFinancials?.total_loans_outstanding || 0;
  const availableBalance = gfTotal - gfOutstanding;
  const totalExpected = gfTotal + gfOutstanding * 0.05;
  const totalArrears = memberFinancials.reduce((sum, m) => sum + m.arrears, 0);

  // Monthly chart data from contributions
  const monthlyData = (() => {
    const months: Record<string, { contributions: number; loans: number }> = {};
    allContributions.forEach((c) => {
      const m = c.month || new Date(c.created_at).toISOString().slice(0, 7);
      if (!months[m]) months[m] = { contributions: 0, loans: 0 };
      months[m].contributions += Number(c.amount);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({ month: month.slice(5), ...data }));
  })();

  const filteredMembers = memberFinancials.filter(
    (m) =>
      m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.membership_number || "").includes(searchQuery)
  );

  const handleOpenUpdateModal = (m: typeof memberFinancials[0]) => {
    setSelectedMember({
      user_id: m.user_id,
      display_name: m.display_name,
      email: m.email,
      membership_number: m.membership_number,
      totalInvested: m.totalInvested,
      loanBalance: m.loanBalance,
      arrears: m.arrears,
      status: m.status,
    });
    setUpdateModalOpen(true);
  };

  const handleReviewLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    setApprovalModalOpen(true);
  };

  const selectedLoan = pendingLoans.find((l) => l.id === selectedLoanId);

  const exportContributions = () => {
    exportToCSV(
      allContributions.map((c) => ({
        Month: c.month, Amount: c.amount, Date: new Date(c.created_at).toLocaleDateString("en-KE"),
      })),
      "contributions-report"
    );
  };

  if (isSettingsPage) {
    return (
      <DashboardLayout title="Settings" subtitle="Configure investment targets and system settings" role="treasurer">
        <SettingsPanel />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Treasurer Dashboard" subtitle="Manage investments, loans, and member finances" role="treasurer">
      <div className="mb-8">
        <FinancialOverview
          totalInvestments={gfTotal}
          totalLoansGiven={gfLoans}
          totalExpectedAfterLoans={totalExpected}
          availableBalance={availableBalance}
          minimumBalance={minimumBalance}
          interestRate={interestRate}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Total Funds" value={`KES ${(gfTotal / 1000).toFixed(0)}K`} subtitle="Collective investment" icon={Wallet} variant="gold" />
        <StatsCard title="Active Members" value={String(groupFinancials?.member_count || 0)} subtitle="Contributing members" icon={Users} variant="default" />
        <StatsCard title="Loans Outstanding" value={`KES ${(gfOutstanding / 1000).toFixed(0)}K`} subtitle={`@ ${interestRate}%/mo`} icon={CreditCard} variant="warning" />
        <StatsCard title="Total Arrears" value={`KES ${(totalArrears / 1000).toFixed(0)}K`} subtitle="Pending collection" icon={AlertTriangle} variant={totalArrears > 0 ? "danger" : "success"} />
        <StatsCard title="Pending Loans" value={pendingLoans.length.toString()} subtitle="Awaiting review" icon={TrendingUp} variant={pendingLoans.length > 0 ? "warning" : "success"} />
      </div>

      {pendingLoans.length > 0 && (
        <div className="mb-8">
          <PendingLoanRequests requests={pendingLoans} onReviewRequest={handleReviewLoan} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(150, 48%, 22%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(150, 48%, 22%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 85%)" />
                    <XAxis dataKey="month" stroke="hsl(150, 15%, 40%)" fontSize={12} />
                    <YAxis stroke="hsl(150, 15%, 40%)" fontSize={12} tickFormatter={(v) => `${v / 1000}K`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(150, 15%, 85%)", borderRadius: "8px" }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]} />
                    <Area type="monotone" dataKey="contributions" stroke="hsl(150, 48%, 22%)" fillOpacity={1} fill="url(#colorContributions)" name="Contributions" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <div className={`p-2 rounded-lg ${Number(t.amount) > 0 ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
                      {Number(t.amount) > 0 ? <ArrowUpRight className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize">{t.type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{(t as any).member_name || ""}</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("en-KE")}</p>
                    </div>
                    <span className="text-sm font-semibold">KES {Math.abs(Number(t.amount)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <ProgressCard title="Investment Target Progress" current={gfTotal} target={investmentTarget} />
      </div>

      {/* Payment Approvals */}
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold mb-4">Payment Verification</h2>
        <PaymentApprovalsPanel />
      </div>

      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>Members Overview</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
            </div>
            <Button variant="outline" size="sm" onClick={exportContributions}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Savings</TableHead>
                  <TableHead className="text-right">Max Loan (5x)</TableHead>
                  <TableHead className="text-right">Arrears</TableHead>
                  <TableHead className="text-right">Loan Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No members found</TableCell></TableRow>
                ) : (
                  filteredMembers.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-semibold text-primary">
                            {m.display_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{m.display_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">#{m.membership_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">KES {m.totalInvested.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-accent font-semibold">KES {(m.totalInvested * 5).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={m.arrears > 0 ? "text-destructive font-medium" : "text-success"}>
                          {m.arrears > 0 ? `KES ${m.arrears.toLocaleString()}` : "None"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.loanBalance > 0 ? <span className="text-warning font-medium">KES {m.loanBalance.toLocaleString()}</span> : <span className="text-muted-foreground">None</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.arrears > 0 ? "destructive" : "default"} className="capitalize">{m.arrears > 0 ? "arrears" : m.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenUpdateModal(m)}>Update Records</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MemberUpdateModal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        member={selectedMember}
      />

      <LoanApprovalModal
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        loan={selectedLoan || null}
        availableBalance={availableBalance}
        minimumBalance={minimumBalance}
      />
    </DashboardLayout>
  );
};

export default TreasurerDashboard;
