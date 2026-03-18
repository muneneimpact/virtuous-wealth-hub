import { useState } from "react";
import {
  Shield, Users, AlertTriangle, Activity, UserCheck, UserX, Clock,
  Search, FileText, Settings, Download, CheckCircle2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
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
  useAuditLogs, useGroupFinancials,
} from "@/hooks/useAppData";
import { exportToCSV } from "@/lib/exportReports";

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: pendingApprovals = [] } = usePendingApprovals();
  const { data: allProfiles = [] } = useAllProfiles();
  const { data: userRoles = [] } = useUserRoles();
  const { data: auditLogs = [] } = useAuditLogs();
  const { data: groupFinancials } = useGroupFinancials();

  const activeMembers = allProfiles.filter((p) => p.status === "active");
  const treasurers = userRoles.filter((r) => r.role === "treasurer");

  const filteredUsers = allProfiles.filter(
    (p) =>
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoles = (userId: string) => userRoles.filter((r) => r.user_id === userId).map((r) => r.role);

  const handleApproveMember = async (profileId: string, userId: string, name: string) => {
    const { error } = await supabase.from("profiles").update({ status: "active" }).eq("id", profileId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("notifications").insert({
      user_id: userId, type: "member_approved" as any,
      title: "Account Approved", message: "Your account has been approved. Welcome to Virtuous Deca Investment!",
    });
    await supabase.from("audit_logs").insert({
      action: "Member Approved", table_name: "profiles", record_id: profileId,
      performed_by: user?.id, new_data: { status: "active", display_name: name },
    });
    toast({ title: "Member Approved", description: `${name} has been activated.` });
    queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
    queryClient.invalidateQueries({ queryKey: ["all-profiles"] });
  };

  const handleRejectMember = async (profileId: string, userId: string, name: string) => {
    const { error } = await supabase.from("profiles").update({ status: "rejected" }).eq("id", profileId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("notifications").insert({
      user_id: userId, type: "member_rejected" as any,
      title: "Account Rejected", message: "Your account application has been rejected. Contact the treasurer for details.",
    });
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
    exportToCSV(
      auditLogs.map((l) => ({
        Action: l.action, Table: l.table_name || "", Record: l.record_id || "",
        Timestamp: new Date(l.created_at).toLocaleString("en-KE"),
      })),
      "audit-logs"
    );
  };

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="System oversight and user management" role="admin">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Members" value={activeMembers.length.toString()} subtitle="Active members" icon={Users} variant="default" />
        <StatsCard title="Treasurers" value={treasurers.length.toString()} subtitle="With full access" icon={UserCheck} variant="gold" />
        <StatsCard title="Pending Approvals" value={pendingApprovals.length.toString()} subtitle="Awaiting review" icon={Clock} variant={pendingApprovals.length > 0 ? "warning" : "success"} />
        <StatsCard title="Total Members" value={String(groupFinancials?.member_count || 0)} subtitle="Active in system" icon={Activity} variant="success" />
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card variant="gold" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Member Approvals
              <Badge variant="secondary">{pendingApprovals.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-background border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {p.display_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{p.display_name}</p>
                      <p className="text-sm text-muted-foreground">{p.email}</p>
                      <p className="text-xs text-muted-foreground font-mono">#{p.membership_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" onClick={() => handleApproveMember(p.id, p.user_id, p.display_name)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRejectMember(p.id, p.user_id, p.display_name)}>
                      <UserX className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Management */}
      <Card variant="elevated" className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>User Management</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Member #</TableHead>
                  <TableHead>Role(s)</TableHead>
                  <TableHead>Status</TableHead>
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
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${hasTreasurer ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"}`}>
                            {u.display_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{u.display_name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{u.membership_number || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {roles.map((r) => (
                            <Badge key={r} variant={r === "treasurer" ? "default" : "secondary"} className="capitalize">{r}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`flex items-center gap-1 ${u.status === "active" ? "text-success" : u.status === "pending" ? "text-warning" : "text-muted-foreground"}`}>
                          <span className={`w-2 h-2 rounded-full ${u.status === "active" ? "bg-success" : u.status === "pending" ? "bg-warning" : "bg-muted-foreground"}`} />
                          {u.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">Actions</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {u.status === "active" || u.status === "suspended" ? (
                              <DropdownMenuItem onClick={() => toggleMemberStatus(u.id, u.status)}>
                                {u.status === "active" ? "Suspend" : "Activate"}
                              </DropdownMenuItem>
                            ) : null}
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

      {/* Audit Logs */}
      <Card variant="bordered">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Audit Logs</CardTitle>
          <Button variant="outline" size="sm" onClick={exportAuditLogs}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No audit logs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell className="text-muted-foreground">{log.table_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
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
    </DashboardLayout>
  );
};

export default AdminDashboard;
