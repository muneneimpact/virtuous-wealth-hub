import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Wallet, CreditCard, Users, History,
  Settings, LogOut, TrendingUp, Shield, ChevronRight, Menu, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

interface NavItem {
  label: string;
  icon: ReactNode;
  href: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  role: "member" | "treasurer" | "admin";
}

const DashboardLayout = ({ children, title, subtitle, role }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const memberNav: NavItem[] = [
    { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, href: "/dashboard" },
    { label: "My Investments", icon: <Wallet className="w-5 h-5" />, href: "/dashboard/investments" },
    { label: "Loans", icon: <CreditCard className="w-5 h-5" />, href: "/dashboard/loans" },
    { label: "Guarantorship", icon: <Users className="w-5 h-5" />, href: "/dashboard/guarantorship" },
    { label: "Transactions", icon: <History className="w-5 h-5" />, href: "/dashboard/transactions" },
  ];

  const treasurerNav: NavItem[] = [
    { label: "Overview", icon: <LayoutDashboard className="w-5 h-5" />, href: "/treasurer" },
    { label: "Members", icon: <Users className="w-5 h-5" />, href: "/treasurer/members" },
    { label: "Contributions", icon: <Wallet className="w-5 h-5" />, href: "/treasurer/contributions" },
    { label: "Loans", icon: <CreditCard className="w-5 h-5" />, href: "/treasurer/loans" },
    { label: "Analytics", icon: <TrendingUp className="w-5 h-5" />, href: "/treasurer/analytics" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, href: "/treasurer/settings" },
  ];

  const adminNav: NavItem[] = [
    { label: "Overview", icon: <LayoutDashboard className="w-5 h-5" />, href: "/admin" },
    { label: "User Management", icon: <Users className="w-5 h-5" />, href: "/admin/users" },
    { label: "Audit Logs", icon: <Shield className="w-5 h-5" />, href: "/admin/audit" },
    { label: "Financial Overview", icon: <TrendingUp className="w-5 h-5" />, href: "/admin/finance" },
    { label: "System Settings", icon: <Settings className="w-5 h-5" />, href: "/admin/settings" },
  ];

  const navItems = role === "admin" ? adminNav : role === "treasurer" ? treasurerNav : memberNav;
  const userName = profile?.display_name || "User";

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 gradient-primary transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-primary-foreground/10">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-10 h-10" />
              <div>
                <h1 className="font-display text-lg font-semibold text-primary-foreground">
                  Virtuous Deca
                </h1>
                <p className="text-xs text-primary-foreground/60 capitalize">{role} Portal</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-primary-foreground/10">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold">
                {userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-foreground truncate">{userName}</p>
                <p className="text-xs text-primary-foreground/60 capitalize">{role}</p>
                {profile?.membership_number && (
                  <p className="text-xs text-primary-foreground/40 font-mono">#{profile.membership_number}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-display text-xl font-semibold">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
