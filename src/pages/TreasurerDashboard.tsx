import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Wallet,
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import ProgressCard from "@/components/dashboard/ProgressCard";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import MemberUpdateModal from "@/components/treasurer/MemberUpdateModal";
import SettingsPanel from "@/components/treasurer/SettingsPanel";
import PendingLoanRequests from "@/components/treasurer/PendingLoanRequests";
import LoanApprovalModal from "@/components/treasurer/LoanApprovalModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Member {
  id: number;
  name: string;
  email: string;
  totalInvested: number;
  arrears: number;
  loanBalance: number;
  status: string;
}

interface GuarantorInfo {
  memberId: number;
  memberName: string;
  amount: number;
  memberSavings: number;
}

interface LoanRequest {
  id: number;
  memberId: number;
  memberName: string;
  amount: number;
  memberSavings: number;
  guarantors: GuarantorInfo[];
  requestDate: string;
  status: "pending" | "approved" | "rejected";
}

const TreasurerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  
  // Settings state
  const [interestRate] = useState(5); // Fixed at 5% per month
  const [investmentTarget, setInvestmentTarget] = useState(5000000);
  const [minimumBalance, setMinimumBalance] = useState(50000);

  // Check if we're on the settings page
  const isSettingsPage = location.pathname === "/treasurer/settings";

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login");
      return;
    }
    const userData = JSON.parse(user);
    if (userData.role !== "treasurer" && userData.role !== "admin") {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Mock data
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "John Mwangi", email: "john@example.com", totalInvested: 28000, arrears: 0, loanBalance: 15000, status: "active" },
    { id: 2, name: "Mary Wanjiku", email: "mary@example.com", totalInvested: 32000, arrears: 0, loanBalance: 0, status: "active" },
    { id: 3, name: "James Kamau", email: "james@example.com", totalInvested: 26000, arrears: 4000, loanBalance: 25000, status: "arrears" },
    { id: 4, name: "Grace Akinyi", email: "grace@example.com", totalInvested: 30000, arrears: 0, loanBalance: 20000, status: "active" },
    { id: 5, name: "Peter Ochieng", email: "peter@example.com", totalInvested: 28000, arrears: 0, loanBalance: 0, status: "active" },
    { id: 6, name: "Susan Njeri", email: "susan@example.com", totalInvested: 24000, arrears: 2000, loanBalance: 10000, status: "arrears" },
  ]);

  // Pending loan requests
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([
    {
      id: 1,
      memberId: 2,
      memberName: "Mary Wanjiku",
      amount: 80000,
      memberSavings: 32000,
      guarantors: [
        { memberId: 5, memberName: "Peter Ochieng", amount: 28000, memberSavings: 28000 },
        { memberId: 4, memberName: "Grace Akinyi", amount: 30000, memberSavings: 30000 },
        { memberId: 1, memberName: "John Mwangi", amount: 10000, memberSavings: 28000 },
      ],
      requestDate: "2024-12-28",
      status: "pending",
    },
    {
      id: 2,
      memberId: 5,
      memberName: "Peter Ochieng",
      amount: 50000,
      memberSavings: 28000,
      guarantors: [
        { memberId: 2, memberName: "Mary Wanjiku", amount: 32000, memberSavings: 32000 },
        { memberId: 4, memberName: "Grace Akinyi", amount: 10000, memberSavings: 30000 },
      ],
      requestDate: "2024-12-29",
      status: "pending",
    },
  ]);

  // Calculate stats
  const totalInvestments = members.reduce((sum, m) => sum + m.totalInvested, 0);
  const totalLoansGiven = members.reduce((sum, m) => sum + m.loanBalance, 0);
  const totalArrears = members.reduce((sum, m) => sum + m.arrears, 0);
  const availableBalance = totalInvestments - totalLoansGiven;
  const totalExpectedAfterLoans = totalInvestments + (totalLoansGiven * 0.05);

  const stats = {
    totalFunds: totalInvestments,
    totalLoansIssued: totalLoansGiven,
    totalArrears: totalArrears,
    activeMembers: members.length,
    collectionRate: 96,
  };

  const monthlyData = [
    { month: "Oct", contributions: 20000, loans: 5000 },
    { month: "Nov", contributions: 20000, loans: 15000 },
    { month: "Dec", contributions: 20000, loans: 10000 },
    { month: "Jan", contributions: 20000, loans: 20000 },
    { month: "Feb", contributions: 20000, loans: 8000 },
    { month: "Mar", contributions: 20000, loans: 12000 },
  ];

  const recentActivity = [
    { id: 1, action: "Contribution received", member: "John Mwangi", amount: 2000, time: "2 hours ago" },
    { id: 2, action: "Loan request", member: "Mary Wanjiku", amount: 80000, time: "5 hours ago" },
    { id: 3, action: "Arrears recorded", member: "James Kamau", amount: 4000, time: "1 day ago" },
    { id: 4, action: "Loan repayment", member: "Grace Akinyi", amount: 5000, time: "2 days ago" },
  ];

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateMember = (updatedMember: Member) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );
    setSelectedMember(updatedMember);
  };

  const handleOpenUpdateModal = (member: Member) => {
    setSelectedMember(member);
    setUpdateModalOpen(true);
  };

  const handleReviewRequest = (request: LoanRequest) => {
    setSelectedRequest(request);
    setApprovalModalOpen(true);
  };

  const handleApproveLoan = (requestId: number, processingFee: number, deductFromLoan: boolean) => {
    setLoanRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, status: "approved" as const } : r
    ));
    // Update member's loan balance
    const request = loanRequests.find(r => r.id === requestId);
    if (request) {
      setMembers(prev => prev.map(m => 
        m.id === request.memberId 
          ? { ...m, loanBalance: m.loanBalance + request.amount }
          : m
      ));
    }
  };

  const handleRejectLoan = (requestId: number, reason: string) => {
    setLoanRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, status: "rejected" as const } : r
    ));
  };

  // Render settings page
  if (isSettingsPage) {
    return (
      <DashboardLayout
        title="Settings"
        subtitle="Configure investment targets and system settings"
        role="treasurer"
      >
        <SettingsPanel
          interestRate={interestRate}
          investmentTarget={investmentTarget}
          onUpdateInterestRate={() => {}} // Interest rate is fixed at 5%
          onUpdateTarget={setInvestmentTarget}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Treasurer Dashboard"
      subtitle="Manage investments, loans, and member finances"
      role="treasurer"
    >
      {/* Financial Overview */}
      <div className="mb-8">
        <FinancialOverview
          totalInvestments={totalInvestments}
          totalLoansGiven={totalLoansGiven}
          totalExpectedAfterLoans={totalExpectedAfterLoans}
          availableBalance={availableBalance}
          minimumBalance={minimumBalance}
          interestRate={interestRate}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard
          title="Total Funds"
          value={`KES ${(stats.totalFunds / 1000).toFixed(0)}K`}
          subtitle="Collective investment"
          icon={Wallet}
          variant="gold"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Active Members"
          value={stats.activeMembers.toString()}
          subtitle="Contributing members"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Loans Issued"
          value={`KES ${(stats.totalLoansIssued / 1000).toFixed(0)}K`}
          subtitle={`@ ${interestRate}%/mo interest`}
          icon={CreditCard}
          variant="warning"
        />
        <StatsCard
          title="Total Arrears"
          value={`KES ${(stats.totalArrears / 1000).toFixed(0)}K`}
          subtitle="Pending collection"
          icon={AlertTriangle}
          variant={stats.totalArrears > 0 ? "danger" : "success"}
        />
        <StatsCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          subtitle="This month"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Pending Loan Requests */}
      <div className="mb-8">
        <PendingLoanRequests
          requests={loanRequests}
          onReviewRequest={handleReviewRequest}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Chart */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(150, 48%, 22%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(150, 48%, 22%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(43, 74%, 49%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(43, 74%, 49%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 85%)" />
                  <XAxis dataKey="month" stroke="hsl(150, 15%, 40%)" fontSize={12} />
                  <YAxis stroke="hsl(150, 15%, 40%)" fontSize={12} tickFormatter={(value) => `${value/1000}K`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(150, 15%, 85%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="contributions"
                    stroke="hsl(150, 48%, 22%)"
                    fillOpacity={1}
                    fill="url(#colorContributions)"
                    name="Contributions"
                  />
                  <Area
                    type="monotone"
                    dataKey="loans"
                    stroke="hsl(43, 74%, 49%)"
                    fillOpacity={1}
                    fill="url(#colorLoans)"
                    name="Loans"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={`p-2 rounded-lg ${
                    activity.action.includes("received") || activity.action.includes("repayment")
                      ? "bg-success/10 text-success"
                      : activity.action.includes("Arrears")
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent/10 text-accent"
                  }`}>
                    {activity.action.includes("received") || activity.action.includes("repayment") ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : activity.action.includes("Arrears") ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <DollarSign className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.member}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    KES {activity.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Progress */}
      <div className="mb-8">
        <ProgressCard title="Investment Target Progress" current={stats.totalFunds} target={investmentTarget} />
      </div>

      {/* Members Table */}
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>Members Overview</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="gold">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Member
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
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-semibold text-primary">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      KES {member.totalInvested.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-accent font-semibold">
                      KES {(member.totalInvested * 5).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={member.arrears > 0 ? "text-destructive font-medium" : "text-success"}>
                        {member.arrears > 0 ? `KES ${member.arrears.toLocaleString()}` : "None"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.loanBalance > 0 ? (
                        <span className="text-warning font-medium">
                          KES {member.loanBalance.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={member.status === "active" ? "default" : "destructive"}
                        className="capitalize"
                      >
                        {member.status === "active" ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenUpdateModal(member)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Update Records
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <MemberUpdateModal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        member={selectedMember}
        onUpdate={handleUpdateMember}
      />

      <LoanApprovalModal
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        request={selectedRequest}
        availableBalance={availableBalance}
        minimumBalance={minimumBalance}
        onApprove={handleApproveLoan}
        onReject={handleRejectLoan}
      />
    </DashboardLayout>
  );
};

export default TreasurerDashboard;
