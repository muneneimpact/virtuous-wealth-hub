import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import MemberDashboard from "./pages/MemberDashboard";
import TreasurerDashboard from "./pages/TreasurerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          
          {/* Member Routes */}
          <Route path="/dashboard" element={<MemberDashboard />} />
          <Route path="/dashboard/investments" element={<MemberDashboard />} />
          <Route path="/dashboard/loans" element={<MemberDashboard />} />
          <Route path="/dashboard/guarantorship" element={<MemberDashboard />} />
          <Route path="/dashboard/transactions" element={<MemberDashboard />} />
          
          {/* Treasurer Routes */}
          <Route path="/treasurer" element={<TreasurerDashboard />} />
          <Route path="/treasurer/members" element={<TreasurerDashboard />} />
          <Route path="/treasurer/contributions" element={<TreasurerDashboard />} />
          <Route path="/treasurer/loans" element={<TreasurerDashboard />} />
          <Route path="/treasurer/analytics" element={<TreasurerDashboard />} />
          <Route path="/treasurer/settings" element={<TreasurerDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminDashboard />} />
          <Route path="/admin/audit" element={<AdminDashboard />} />
          <Route path="/admin/finance" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminDashboard />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
