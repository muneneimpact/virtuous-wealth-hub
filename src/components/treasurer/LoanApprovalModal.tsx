import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle2, XCircle, Calculator, Users, Banknote, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface PendingLoan {
  id: string;
  member_id: string;
  amount: number;
  interest_rate: number;
  created_at?: string;
  member_name: string;
  member_savings: number;
  guarantors: Array<{
    id: string;
    guarantor_id: string;
    amount: number;
    status: string;
    guarantor_name: string;
    guarantor_savings: number;
  }>;
}

interface LoanApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: PendingLoan | null;
  availableBalance: number;
  minimumBalance: number;
}

const LoanApprovalModal = ({ open, onOpenChange, loan, availableBalance, minimumBalance }: LoanApprovalModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [processingFee, setProcessingFee] = useState("0");
  const [deductFromLoan, setDeductFromLoan] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!loan) return null;

  const totalGuarantee = loan.guarantors.reduce((sum, g) => sum + Number(g.amount), 0);
  const requiredGuarantee = Number(loan.amount) * 0.8;
  const isGuaranteeValid = totalGuarantee >= requiredGuarantee;

  const guarantorValidations = loan.guarantors.map((g) => ({
    ...g,
    isValid: Number(g.amount) <= g.guarantor_savings,
    percentage: g.guarantor_savings > 0 ? ((Number(g.amount) / g.guarantor_savings) * 100).toFixed(0) : "0",
  }));
  const allGuarantorsValid = guarantorValidations.every((g) => g.isValid);

  const fee = parseFloat(processingFee) || 0;
  const disbursementAmount = deductFromLoan ? Number(loan.amount) - fee : Number(loan.amount);
  const balanceAfterDisbursement = availableBalance - disbursementAmount;
  const canDisburse = balanceAfterDisbursement >= minimumBalance;

  const interestAmount = Number(loan.amount) * 0.05;

  const handleApprove = async () => {
    if (!canDisburse) {
      toast({ title: "Cannot Approve", description: `Would leave balance below KES ${minimumBalance.toLocaleString()}.`, variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      await supabase.from("loans").update({
        status: "disbursed" as any,
        approved_by: user!.id,
        disbursement_date: new Date().toISOString(),
        processing_fee: fee,
        deduct_fee_from_loan: deductFromLoan,
      }).eq("id", loan.id);

      await supabase.from("transactions").insert({
        amount: -disbursementAmount, type: "loan_disbursement",
        member_id: loan.member_id, reference_id: loan.id,
        description: `Loan disbursed: KES ${disbursementAmount.toLocaleString()}`,
        created_by: user!.id,
      });

      await supabase.from("notifications").insert({
        user_id: loan.member_id, type: "loan_disbursed" as any,
        title: "Loan Approved & Disbursed",
        message: `Your loan of KES ${Number(loan.amount).toLocaleString()} has been approved. KES ${disbursementAmount.toLocaleString()} disbursed.`,
        data: { loan_id: loan.id },
      });

      await supabase.from("audit_logs").insert({
        action: "Loan Approved", table_name: "loans", record_id: loan.id,
        performed_by: user!.id, new_data: { amount: loan.amount, member: loan.member_name, fee },
      });

      toast({ title: "Loan Approved", description: `KES ${disbursementAmount.toLocaleString()} disbursed to ${loan.member_name}.` });
      queryClient.invalidateQueries({ queryKey: ["pending-loans"] });
      queryClient.invalidateQueries({ queryKey: ["group-financials"] });
      queryClient.invalidateQueries({ queryKey: ["all-transactions"] });
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await supabase.from("loans").update({
        status: "rejected" as any, rejection_reason: rejectionReason,
      }).eq("id", loan.id);

      await supabase.from("notifications").insert({
        user_id: loan.member_id, type: "loan_rejected" as any,
        title: "Loan Rejected",
        message: `Your loan of KES ${Number(loan.amount).toLocaleString()} was rejected. ${rejectionReason || ""}`,
        data: { loan_id: loan.id },
      });

      toast({ title: "Loan Rejected", description: `Loan from ${loan.member_name} rejected.` });
      queryClient.invalidateQueries({ queryKey: ["pending-loans"] });
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const resetForm = () => { setProcessingFee("0"); setDeductFromLoan(true); setRejectionReason(""); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Review Loan Request</DialogTitle>
          <DialogDescription>Verify guarantor information and decide on this loan request.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Requested by</p>
                <p className="font-display text-xl font-semibold">{loan.member_name}</p>
              </div>
              <Badge variant="secondary">{new Date(loan.created_at || "").toLocaleDateString("en-KE")}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Loan Amount</p><p className="font-semibold text-lg">KES {Number(loan.amount).toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Savings</p><p className="font-semibold">KES {loan.member_savings.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Max (5x)</p><p className="font-semibold text-accent">KES {(loan.member_savings * 5).toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Interest (5%/mo)</p><p className="font-semibold text-warning">KES {interestAmount.toLocaleString()}</p></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Guarantors ({loan.guarantors.length})</Label>
              <Badge variant={isGuaranteeValid && allGuarantorsValid ? "default" : "destructive"}>
                {isGuaranteeValid && allGuarantorsValid ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                KES {totalGuarantee.toLocaleString()} / {requiredGuarantee.toLocaleString()} (80%)
              </Badge>
            </div>
            {guarantorValidations.map((g) => (
              <div key={g.id} className={`p-4 rounded-lg border ${g.isValid ? "bg-muted/50" : "bg-destructive/5 border-destructive/30"}`}>
                <div className="flex items-center justify-between">
                  <div><p className="font-medium">{g.guarantor_name}</p><p className="text-sm text-muted-foreground">Savings: KES {g.guarantor_savings.toLocaleString()}</p></div>
                  <div className="text-right"><p className="font-semibold text-lg">KES {Number(g.amount).toLocaleString()}</p><p className={`text-xs ${g.isValid ? "text-muted-foreground" : "text-destructive"}`}>{g.percentage}% of savings</p></div>
                </div>
                {!g.isValid && <p className="text-sm text-destructive mt-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Exceeds savings!</p>}
              </div>
            ))}
          </div>

          <div className={`p-4 rounded-xl border ${canDisburse ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
            <div className="flex items-center gap-2 mb-3"><Banknote className="w-5 h-5" /><span className="font-semibold">Balance Check</span></div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-muted-foreground">Available</p><p className="font-semibold">KES {availableBalance.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">After Disbursement</p><p className={`font-semibold ${canDisburse ? "text-success" : "text-destructive"}`}>KES {balanceAfterDisbursement.toLocaleString()}</p></div>
              <div><p className="text-muted-foreground">Minimum</p><p className="font-semibold">KES {minimumBalance.toLocaleString()}</p></div>
            </div>
            {!canDisburse && <p className="text-sm text-destructive mt-3 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Balance would drop below minimum.</p>}
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2"><Calculator className="w-4 h-4" /> Processing Fee</Label>
            <div className="flex items-center gap-4">
              <Input type="number" placeholder="Fee" value={processingFee} onChange={(e) => setProcessingFee(e.target.value)} className="flex-1" />
              <div className="flex items-center gap-2">
                <Checkbox id="deductFromLoan" checked={deductFromLoan} onCheckedChange={(c) => setDeductFromLoan(c === true)} />
                <Label htmlFor="deductFromLoan" className="text-sm cursor-pointer">Deduct from loan</Label>
              </div>
            </div>
            {fee > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex justify-between"><span>Loan:</span><span>KES {Number(loan.amount).toLocaleString()}</span></div>
                <div className="flex justify-between text-muted-foreground"><span className="flex items-center gap-1"><Minus className="w-3 h-3" /> Fee:</span><span>KES {fee.toLocaleString()}</span></div>
                <hr className="my-2 border-border" />
                <div className="flex justify-between font-semibold"><span>Receives:</span><span className="text-primary">KES {disbursementAmount.toLocaleString()}</span></div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Rejection Reason (if rejecting)</Label>
            <Input placeholder="Enter reason..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleReject} disabled={isProcessing}><XCircle className="w-4 h-4 mr-2" /> Reject</Button>
          <Button variant="gold" onClick={handleApprove} disabled={!canDisburse || !isGuaranteeValid || !allGuarantorsValid || isProcessing}>
            {isProcessing ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing...</span> : <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Approve & Disburse</span>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoanApprovalModal;
