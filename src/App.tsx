import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";
import MemberDashboard from "./pages/MemberDashboard";
import TreasurerDashboard from "./pages/TreasurerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Member Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="member">
                <MemberDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/:section" element={
              <ProtectedRoute requiredRole="member">
                <MemberDashboard />
              </ProtectedRoute>
            } />

            {/* Treasurer Routes */}
            <Route path="/treasurer" element={
              <ProtectedRoute requiredRole="treasurer">
                <TreasurerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/treasurer/:section" element={
              <ProtectedRoute requiredRole="treasurer">
                <TreasurerDashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/:section" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
