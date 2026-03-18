import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

// ===== Settings =====
export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

// ===== Group Financials =====
export const useGroupFinancials = () =>
  useQuery({
    queryKey: ["group-financials"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_group_financials");
      if (error) throw error;
      return data as unknown as {
        total_contributions: number;
        total_loans_disbursed: number;
        total_loans_outstanding: number;
        total_repaid: number;
        member_count: number;
      };
    },
  });

// ===== My Contributions =====
export const useMyContributions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-contributions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("*")
        .eq("member_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// ===== My Loans =====
export const useMyLoans = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-loans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("member_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// ===== My Transactions =====
export const useMyTransactions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("member_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// ===== Guarantor Requests (pending for current user to respond) =====
export const useMyGuarantorRequests = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-guarantor-requests", user?.id],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from("loan_guarantors")
        .select("*")
        .eq("guarantor_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      const loanIds = [...new Set(requests.map((r) => r.loan_id))];
      const { data: loans } = await supabase.from("loans").select("*").in("id", loanIds);
      const memberIds = [...new Set((loans || []).map((l) => l.member_id))];
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", memberIds);

      return requests.map((req) => {
        const loan = loans?.find((l) => l.id === req.loan_id);
        const borrower = profiles?.find((p) => p.user_id === loan?.member_id);
        return {
          ...req,
          loan_amount: Number(loan?.amount || 0),
          loan_member_id: loan?.member_id || "",
          borrower_name: borrower?.display_name || "Unknown",
          borrower_membership: borrower?.membership_number || "",
        };
      });
    },
    enabled: !!user,
  });
};

// ===== My Guarantorships (all statuses) =====
export const useMyGuarantorships = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-guarantorships", user?.id],
    queryFn: async () => {
      const { data: guarantorships, error } = await supabase
        .from("loan_guarantors")
        .select("*")
        .eq("guarantor_id", user!.id);
      if (error) throw error;
      if (!guarantorships || guarantorships.length === 0) return [];

      const loanIds = [...new Set(guarantorships.map((g) => g.loan_id))];
      const { data: loans } = await supabase.from("loans").select("*").in("id", loanIds);
      const memberIds = [...new Set((loans || []).map((l) => l.member_id))];
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", memberIds);

      return guarantorships.map((g) => {
        const loan = loans?.find((l) => l.id === g.loan_id);
        const borrower = profiles?.find((p) => p.user_id === loan?.member_id);
        return {
          ...g,
          loan,
          borrower_name: borrower?.display_name || "Unknown",
        };
      });
    },
    enabled: !!user,
  });
};

// ===== Member Financials (treasurer/admin - members with sums) =====
export const useMemberFinancials = () =>
  useQuery({
    queryKey: ["member-financials"],
    queryFn: async () => {
      const { data: members } = await supabase
        .from("profiles")
        .select("*")
        .in("status", ["active", "suspended"])
        .order("display_name");

      const { data: contributions } = await supabase
        .from("contributions")
        .select("member_id, amount");

      const { data: loans } = await supabase
        .from("loans")
        .select("member_id, amount, repaid_amount, status")
        .in("status", ["disbursed", "approved"]);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("member_id, amount, type")
        .in("type", ["arrears", "arrears_cleared"]);

      const contribSums: Record<string, number> = {};
      (contributions || []).forEach((c) => {
        contribSums[c.member_id] = (contribSums[c.member_id] || 0) + Number(c.amount);
      });

      const loanBalances: Record<string, number> = {};
      (loans || []).forEach((l) => {
        loanBalances[l.member_id] =
          (loanBalances[l.member_id] || 0) + (Number(l.amount) - Number(l.repaid_amount));
      });

      const arrearsSums: Record<string, number> = {};
      (transactions || []).forEach((t) => {
        if (t.member_id) {
          if (t.type === "arrears")
            arrearsSums[t.member_id] = (arrearsSums[t.member_id] || 0) + Number(t.amount);
          if (t.type === "arrears_cleared")
            arrearsSums[t.member_id] = (arrearsSums[t.member_id] || 0) - Number(t.amount);
        }
      });

      return (members || []).map((m) => ({
        ...m,
        totalInvested: contribSums[m.user_id] || 0,
        loanBalance: loanBalances[m.user_id] || 0,
        arrears: Math.max(0, arrearsSums[m.user_id] || 0),
      }));
    },
  });

// ===== Pending Loans (treasurer) =====
export const usePendingLoans = () =>
  useQuery({
    queryKey: ["pending-loans"],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from("loans")
        .select("*")
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!loans || loans.length === 0) return [];

      const loanIds = loans.map((l) => l.id);
      const { data: guarantors } = await supabase
        .from("loan_guarantors")
        .select("*")
        .in("loan_id", loanIds);

      const memberIds = [...new Set(loans.map((l) => l.member_id))];
      const guarantorIds = [...new Set((guarantors || []).map((g) => g.guarantor_id))];
      const allUserIds = [...new Set([...memberIds, ...guarantorIds])];
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", allUserIds);

      const { data: contributions } = await supabase
        .from("contributions")
        .select("member_id, amount")
        .in("member_id", allUserIds);

      const contribSums: Record<string, number> = {};
      (contributions || []).forEach((c) => {
        contribSums[c.member_id] = (contribSums[c.member_id] || 0) + Number(c.amount);
      });

      return loans.map((loan) => {
        const member = profiles?.find((p) => p.user_id === loan.member_id);
        const loanGuarantors = (guarantors || [])
          .filter((g) => g.loan_id === loan.id)
          .map((g) => {
            const gProfile = profiles?.find((p) => p.user_id === g.guarantor_id);
            return {
              ...g,
              guarantor_name: gProfile?.display_name || "Unknown",
              guarantor_savings: contribSums[g.guarantor_id] || 0,
            };
          });

        return {
          ...loan,
          member_name: member?.display_name || "Unknown",
          member_membership: member?.membership_number || "",
          member_savings: contribSums[loan.member_id] || 0,
          guarantors: loanGuarantors,
        };
      });
    },
  });

// ===== All Transactions (treasurer/admin) =====
export const useAllTransactions = () =>
  useQuery({
    queryKey: ["all-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Get profile names for transactions
      const memberIds = [...new Set((data || []).filter((t) => t.member_id).map((t) => t.member_id!))];
      let profiles: any[] = [];
      if (memberIds.length > 0) {
        const { data: p } = await supabase.from("profiles").select("user_id, display_name").in("user_id", memberIds);
        profiles = p || [];
      }

      return (data || []).map((t) => ({
        ...t,
        member_name: profiles.find((p) => p.user_id === t.member_id)?.display_name || "Unknown",
      }));
    },
  });

// ===== Pending Approvals (admin) =====
export const usePendingApprovals = () =>
  useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

// ===== All Profiles (admin) =====
export const useAllProfiles = () =>
  useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("display_name");
      if (error) throw error;
      return data || [];
    },
  });

// ===== User Roles (admin) =====
export const useUserRoles = () =>
  useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data || [];
    },
  });

// ===== Audit Logs (admin) =====
export const useAuditLogs = () =>
  useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

// ===== Notifications (with realtime) =====
export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
};

// ===== All Contributions (treasurer) =====
export const useAllContributions = () =>
  useQuery({
    queryKey: ["all-contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
