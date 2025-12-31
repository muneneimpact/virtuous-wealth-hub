import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  AlertTriangle,
  Activity,
  Eye,
  UserCheck,
  UserX,
  Clock,
  Search,
  FileText,
  Settings,
  Database,
  Lock,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login");
      return;
    }
    const userData = JSON.parse(user);
    if (userData.role !== "admin") {
      navigate(userData.role === "treasurer" ? "/treasurer" : "/dashboard");
    }
  }, [navigate]);

  // Mock data
  const stats = {
    totalUsers: 12,
    activeTreasurers: 2,
    systemHealth: 99.9,
    pendingActions: 3,
  };

  const users = [
    { id: 1, name: "Mary Wanjiku", email: "treasurer@virtuous.co.ke", role: "treasurer", status: "active", lastLogin: "2 hours ago" },
    { id: 2, name: "David Otieno", email: "david@example.com", role: "treasurer", status: "inactive", lastLogin: "5 days ago" },
    { id: 3, name: "John Mwangi", email: "member@virtuous.co.ke", role: "member", status: "active", lastLogin: "1 hour ago" },
    { id: 4, name: "James Kamau", email: "james@example.com", role: "member", status: "active", lastLogin: "3 hours ago" },
    { id: 5, name: "Grace Akinyi", email: "grace@example.com", role: "member", status: "active", lastLogin: "1 day ago" },
  ];

  const auditLogs = [
    { id: 1, action: "Loan disbursement", user: "Mary Wanjiku", target: "James Kamau", amount: "KES 30,000", timestamp: "2024-12-30 14:32:00" },
    { id: 2, action: "Contribution update", user: "Mary Wanjiku", target: "All members", amount: "Monthly cycle", timestamp: "2024-12-01 09:00:00" },
    { id: 3, action: "Arrears recorded", user: "Mary Wanjiku", target: "Susan Njeri", amount: "KES 2,000", timestamp: "2024-11-28 11:45:00" },
    { id: 4, action: "Interest rate change", user: "Peter Ochieng", target: "System settings", amount: "5% → 5.5%", timestamp: "2024-11-15 16:20:00" },
    { id: 5, action: "New member added", user: "Mary Wanjiku", target: "Grace Akinyi", amount: "-", timestamp: "2024-11-10 10:00:00" },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="System oversight and user management"
      role="admin"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          subtitle="All system users"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Active Treasurers"
          value={stats.activeTreasurers.toString()}
          subtitle="With full access"
          icon={UserCheck}
          variant="gold"
        />
        <StatsCard
          title="System Health"
          value={`${stats.systemHealth}%`}
          subtitle="All systems operational"
          icon={Activity}
          variant="success"
        />
        <StatsCard
          title="Pending Actions"
          value={stats.pendingActions.toString()}
          subtitle="Requires attention"
          icon={AlertTriangle}
          variant={stats.pendingActions > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Actions */}
        <Card variant="gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="default" className="w-full justify-start">
              <Users className="w-4 h-4 mr-3" />
              Manage User Roles
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Database className="w-4 h-4 mr-3" />
              Backup Data
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Lock className="w-4 h-4 mr-3" />
              Security Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-3" />
              System Configuration
            </Button>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card variant="bordered" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Arrears Alert</p>
                  <p className="text-sm text-muted-foreground">
                    2 members have outstanding arrears totaling KES 6,000
                  </p>
                </div>
                <Button size="sm" variant="outline">Review</Button>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/20">
                <Clock className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Monthly Cycle Reminder</p>
                  <p className="text-sm text-muted-foreground">
                    January 2025 contribution cycle starts in 2 days
                  </p>
                </div>
                <Button size="sm" variant="outline">Dismiss</Button>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted">
                <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Loan Review Pending</p>
                  <p className="text-sm text-muted-foreground">
                    1 loan application awaiting secondary approval
                  </p>
                </div>
                <Button size="sm" variant="outline">View</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card variant="elevated" className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>User Management</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          user.role === "treasurer" 
                            ? "bg-accent/20 text-accent" 
                            : user.role === "admin"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "treasurer" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {user.role === "treasurer" && <UserCheck className="w-3 h-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 ${
                        user.status === "active" ? "text-success" : "text-muted-foreground"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          user.status === "active" ? "bg-success" : "bg-muted-foreground"
                        }`} />
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={user.status === "active"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card variant="bordered">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Logs
          </CardTitle>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.target}</TableCell>
                    <TableCell className="text-muted-foreground">{log.amount}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(log.timestamp).toLocaleString("en-KE")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;
