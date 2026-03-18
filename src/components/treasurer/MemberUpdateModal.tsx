import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, CreditCard, AlertTriangle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface MemberData {
  user_id: string;
  display_name: string;
  email: string | null;
  membership_number: string | null;
  totalInvested: number;
  loanBalance: number;
  arrears: number;
  status: string;
}

interface MemberUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberData | null;
}

const MemberUpdateModal = ({ open, onOpenChange, member }: MemberUpdateModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionMonth, setContributionMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [arrearsAmount, setArrearsAmount] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!member) return null;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["member-financials"] });
    queryClient.invalidateQueries({ queryKey: ["all-contributions"] });
    queryClient.invalidateQueries({ queryKey: ["all-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["group-financials"] });
  };

  const handleAddContribution = async () => {
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { error: cErr } = await supabase.from("contributions").insert({
        member_id: member.user_id,
        amount,
        month: contributionMonth,
        recorded_by: user!.id,
      });
      if (cErr) throw cErr;

      await supabase.from("transactions").insert({
        amount, type: "contribution", member_id: member.user_id,
        description: `Monthly contribution for ${contributionMonth}`,
        created_by: user!.id,
      });

      await supabase.from("notifications").insert({
        user_id: member.user_id, type: "contribution_recorded" as any,
        title: "Contribution Recorded",
        message: `KES ${amount.toLocaleString()} recorded for ${contributionMonth}.`,
      });

      toast({ title: "Contribution Recorded", description: `KES ${amount.toLocaleString()} added.` });
      setContributionAmount("");
      invalidateAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleRecordArrears = async () => {
    const amount = parseFloat(arrearsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await supabase.from("transactions").insert({
        amount, type: "arrears", member_id: member.user_id,
        description: "Arrears recorded", created_by: user!.id,
      });
      toast({ title: "Arrears Recorded", description: `KES ${amount.toLocaleString()} arrears added.` });
      setArrearsAmount("");
      invalidateAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleClearArrears = async () => {
    setIsSaving(true);
    try {
      await supabase.from("transactions").insert({
        amount: member.arrears, type: "arrears_cleared", member_id: member.user_id,
        description: "Arrears cleared", created_by: user!.id,
      });
      toast({ title: "Arrears Cleared" });
      invalidateAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsSaving(false);
  };

  const handleRecordRepayment = async () => {
    const amount = parseFloat(repaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", variant: "destructive" });
      return;
    }
    if (amount > member.loanBalance) {
      toast({ title: "Exceeds Balance", description: "Cannot exceed loan balance.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      // Find active loan and update repaid_amount
      const { data: loans } = await supabase
        .from("loans")
        .select("id, repaid_amount, amount")
        .eq("member_id", member.user_id)
        .eq("status", "disbursed")
        .order("created_at", { ascending: false })
        .limit(1);

      if (loans && loans.length > 0) {
        const loan = loans[0];
        const newRepaid = Number(loan.repaid_amount) + amount;
        const updates: any = { repaid_amount: newRepaid };
        if (newRepaid >= Number(loan.amount)) {
          updates.status = "repaid";
        }
        await supabase.from("loans").update(updates).eq("id", loan.id);
      }

      await supabase.from("transactions").insert({
        amount, type: "loan_repayment", member_id: member.user_id,
        description: "Loan repayment", created_by: user!.id,
      });

      toast({ title: "Repayment Recorded", description: `KES ${amount.toLocaleString()} recorded.` });
      setRepaymentAmount("");
      invalidateAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Update Member Records</DialogTitle>
          <DialogDescription>
            Updating records for <span className="font-semibold">{member.display_name}</span>
            {member.membership_number && <span className="font-mono"> (#{member.membership_number})</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-muted/50 mb-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Invested</p>
              <p className="font-semibold text-primary">KES {member.totalInvested.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Arrears</p>
              <p className={`font-semibold ${member.arrears > 0 ? "text-destructive" : "text-success"}`}>
                {member.arrears > 0 ? `KES ${member.arrears.toLocaleString()}` : "None"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Loan Balance</p>
              <p className={`font-semibold ${member.loanBalance > 0 ? "text-warning" : "text-muted-foreground"}`}>
                {member.loanBalance > 0 ? `KES ${member.loanBalance.toLocaleString()}` : "None"}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="contribution" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contribution" className="text-xs"><Wallet className="w-3 h-3 mr-1" /> Contribution</TabsTrigger>
            <TabsTrigger value="arrears" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" /> Arrears</TabsTrigger>
            <TabsTrigger value="repayment" className="text-xs"><CreditCard className="w-3 h-3 mr-1" /> Loan Repayment</TabsTrigger>
          </TabsList>

          <TabsContent value="contribution" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Input type="month" value={contributionMonth} onChange={(e) => setContributionMonth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Amount (KES)</Label>
              <Input type="number" placeholder="Enter amount" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} />
            </div>
            <Button variant="gold" className="w-full" onClick={handleAddContribution} disabled={isSaving || !contributionAmount}>
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Record Contribution
                </span>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="arrears" className="space-y-4 mt-4">
            {member.arrears > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Current Arrears: KES {member.arrears.toLocaleString()}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Arrears Amount (KES)</Label>
              <Input type="number" placeholder="Enter amount" value={arrearsAmount} onChange={(e) => setArrearsAmount(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" onClick={handleRecordArrears} disabled={isSaving || !arrearsAmount}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Record Arrears"
                )}
              </Button>
              {member.arrears > 0 && (
                <Button variant="outline" className="flex-1" onClick={handleClearArrears} disabled={isSaving}>
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Clearing...
                    </span>
                  ) : (
                    "Clear All"
                  )}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="repayment" className="space-y-4 mt-4">
            {member.loanBalance > 0 ? (
              <>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm font-medium text-warning flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Outstanding: KES {member.loanBalance.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Repayment Amount (KES)</Label>
                  <Input type="number" placeholder="Enter amount" value={repaymentAmount} onChange={(e) => setRepaymentAmount(e.target.value)} max={member.loanBalance} />
                </div>
                <Button variant="default" className="w-full" onClick={handleRecordRepayment} disabled={isSaving || !repaymentAmount}>
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Record Repayment
                    </span>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No active loan for this member</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberUpdateModal;
