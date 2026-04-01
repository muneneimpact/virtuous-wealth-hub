import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Shield, Users, AlertTriangle, Activity, UserCheck, UserX, Clock,
  Search, FileText, Settings, Download, CheckCircle2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePendingApprovals, useAllProfiles, useUserRoles,
  useAuditLogs, useGroupFinancials, useSettings,
} from "@/hooks/useAppData";
import { exportToCSV } from "@/lib/exportReports";

const AdminDashboard = () => {
  const { section } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: pendingApprovals = [] } = usePendingApprovals();
  const { data: allProfiles = [] } = useAllProfiles();
  const { data: userRoles = [] } = useUserRoles();
  const { data: auditLogs = [] } = useAuditLogs();
  const { data: groupFinancials } = useGroupFinancials();
  const { data: settings } = useSettings();

  const currentSection = section || "overview";
  const activeMembers = allProfiles.filter((p) => p.status === "active");
  const treasurers = userRoles.filter((r) => r.role === "treasurer");
  const interestRate = settings?.interest_rate ? Number(settings.interest_rate) : 5;
  const minimumBalance = settings?.minimum_balance ? Number(settings.minimum_balance) : 50000;
  const gfTotal = groupFinancials?.total_contributions || 0;
  const gfLoans = groupFinancials?.total_loans_disbursed || 0;
  const gfOutstanding = groupFinancials?.total_loans_outstanding || 0;
  const availableBalance = gfTotal - gfOutstanding;
  const totalExpected = gfTotal + gfOutstanding * 0.05;

  const filteredUsers = allProfiles.filter(
    (p) =>
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoles = (userId: string) => userRoles.filter((r) => r.user_id === userId).map((r) => r.role);

  const handleApproveMember = async (profileId: string, userId: string, name: string) => {
    const { error } = await supabase.from("profiles").update({ status: "active" }).eq("id", profileId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("notifications").insert({ user_id: userId, type: "member_approved" as any, title: "Account Approved", message: "Your account has been approved. Welcome to Virtuous Deca Investment!" });
    await supabase.from("audit_logs").insert({ action: "Member Approved", table_name: "profiles", record_id: profileId, performed_by: user?.id, new_data: { status: "active", display_name: name } });
    toast({ title: "Member Approved", description: `${name} has been activated.` });
    queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
    queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
  };

  const handleRejectMember = async (profileId: string, userId: string, name: string) => {
    const { error } = await supabase.from("profiles").update({ status: "rejected" }).eq("id", profileId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("notifications").insert({ user_id: userId, type: "member_rejected" as any, title: "Account Rejected", message: "Your account application has been rejected." });
    toast({ title: "Member Rejected", description: `${name} has been rejected.` });
    queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
    queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
  };

  const toggleTreasurerRole = async (userId: string, hasTreasurerRole: boolean) => {
    if (hasTreasurerRole) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "treasurer" as any);
      toast({ title: "Role Removed", description: "Treasurer role removed." });
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "treasurer" as any });
      toast({ title: "Role Added", description: "Treasurer role assigned." });
    }
    queryClient.invalidateQueries({ queryKey: ["user-roles"] });
  };

  const toggleMemberStatus = async (profileId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    await supabase.from("profiles").update({ status: newStatus }).eq("id", profileId);
    toast({ title: "Status Updated", description: `Member ${newStatus}.` });
    queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
  };

  const exportAuditLogs = () => {
    exportToCSV(auditLogs.map((l) => ({ Action: l.action, Table: l.table_name || "", Record: l.record_id || "", Timestamp: new Date(l.created_at).toLocaleString("en-KE") })), "audit-logs");
  };

  const renderPendingApprovals = () => pendingApprovals.length > 0 && (
    <Card variant="gold" className="mb-6 lg:mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="w-5 h-5 text-warning" />
          Pending Member Approvals
          <Badge variant="secondary">{pendingApprovals.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {pendingApprovals.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-background border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary shrink-0">
                  {p.display_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">{p.display_name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{p.email}</p>
                  <p className="text-xs text-muted-foreground font-mono">#{p.membership_number}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="default" size="sm" className="flex-1 sm:flex-none" onClick={() => handleApproveMember(p.id, p.user_id, p.display_name)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={() => handleRejectMember(p.id, p.user_id, p.display_name)}>
                  <UserX className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderUserManagement = () => (
    <Card variant="elevated" className="mb-6 lg:mb-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="text-base sm:text-lg">User Management</CardTitle>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full sm:w-64" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Member #</TableHead>
                <TableHead>Role(s)</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const roles = getRoles(u.user_id);
                const hasTreasurer = roles.includes("treasurer");
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${hasTreasurer ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"}`}>
                          {u.display_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{u.display_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          <p className="text-xs text-muted-foreground font-mono sm:hidden">#{u.membership_number}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm hidden sm:table-cell">{u.membership_number || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {roles.map((r) => (
                          <Badge key={r} variant={r === "treasurer" ? "default" : "secondary"} className="capitalize text-xs">{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`flex items-center gap-1 text-sm ${u.status === "active" ? "text-success" : u.status === "pending" ? "text-warning" : "text-muted-foreground"}`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${u.status === "active" ? "bg-success" : u.status === "pending" ? "bg-warning" : "bg-muted-foreground"}`} />
                        {u.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs sm:text-sm">Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(u.status === "active" || u.status === "suspended") && (
                            <DropdownMenuItem onClick={() => toggleMemberStatus(u.id, u.status)}>
                              {u.status === "active" ? "Suspend" : "Activate"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => toggleTreasurerRole(u.user_id, hasTreasurer)}>
                            {hasTreasurer ? "Remove Treasurer" : "Make Treasurer"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderAuditLogs = () => (
    <Card variant="bordered">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><FileText className="w-5 h-5" /> Audit Logs</CardTitle>
        <Button variant="outline" size="sm" onClick={exportAuditLogs} className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm sm:text-base">No audit logs yet</p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6 max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden sm:table-cell">Table</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-sm">{log.action}</TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{log.table_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs sm:text-sm">
                      {new Date(log.created_at).toLocaleString("en-KE")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (currentSection) {
      case "users": return <>{renderPendingApprovals()}{renderUserManagement()}</>;
      case "audit": return renderAuditLogs();
      case "finance":
        return (
          <div className="space-y-6">
            <FinancialOverview totalInvestments={gfTotal} totalLoansGiven={gfLoans} totalExpectedAfterLoans={totalExpected} availableBalance={availableBalance} minimumBalance={minimumBalance} interestRate={interestRate} />
          </div>
        );
      default:
        return (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
              <StatsCard title="Total Members" value={activeMembers.length.toString()} subtitle="Active members" icon={Users} variant="default" />
              <StatsCard title="Treasurers" value={treasurers.length.toString()} subtitle="With access" icon={UserCheck} variant="gold" />
              <StatsCard title="Pending" value={pendingApprovals.length.toString()} subtitle="Awaiting review" icon={Clock} variant={pendingApprovals.length > 0 ? "warning" : "success"} />
              <StatsCard title="In System" value={String(groupFinancials?.member_count || 0)} subtitle="Active" icon={Activity} variant="success" />
            </div>

            {renderPendingApprovals()}
            {renderUserManagement()}
            {renderAuditLogs()}
          </>
        );
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="System oversight and user management" role="admin">
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
