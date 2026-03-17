import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "treasurer" | "member";
  requireApproval?: boolean;
}

const ProtectedRoute = ({ children, requiredRole, requireApproval = true }: ProtectedRouteProps) => {
  const { user, profile, roles, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if account is approved
  if (requireApproval && profile?.status === "pending") {
    return <Navigate to="/pending-approval" replace />;
  }

  if (requireApproval && profile?.status === "rejected") {
    return <Navigate to="/account-rejected" replace />;
  }

  // Check role
  if (requiredRole && !roles.includes(requiredRole)) {
    // Redirect to appropriate dashboard
    if (roles.includes("admin")) return <Navigate to="/admin" replace />;
    if (roles.includes("treasurer")) return <Navigate to="/treasurer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
