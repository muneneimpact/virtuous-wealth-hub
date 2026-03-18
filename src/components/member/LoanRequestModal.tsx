import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Calculator, Users, Send, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface GuarantorEntry {
  userId: string;
  name: string;
  membershipNumber: string;
  savings: number;
  amount: string;
}

interface LoanRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxLoanAmount: number;
  totalSavings: number;
  currentLoanBalance: number;
}

const LoanRequestModal = ({
  open, onOpenChange, maxLoanAmount, totalSavings, currentLoanBalance,
}: LoanRequestModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loanAmount, setLoanAmount] = useState("");
  const [guarantors, setGuarantors] = useState<GuarantorEntry[]>([]);
  const [lookupNumber, setLookupNumber] = useState("");
  const [isLooking, setIsLooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxEligibility = totalSavings * 5;
  const parsedAmount = parseFloat(loanAmount) || 0;
  const requiredGuarantee = parsedAmount * 0.8;
  const totalGuarantee = guarantors.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
  const isGuaranteeValid = totalGuarantee >= requiredGuarantee;
  const isAmountValid = parsedAmount > 0 && parsedAmount <= maxLoanAmount;

  const guarantorValidations = useMemo(() => {
    return guarantors.map((g) => {
      const amt = parseFloat(g.amount) || 0;
      return { ...g, valid: amt > 0 && amt <= g.savings };
    });
  }, [guarantors]);

  const allGuarantorsValid = guarantorValidations.every((g) => g.valid || !(parseFloat(g.amount) > 0));
  const hasGuarantors = guarantors.some((g) => parseFloat(g.amount) > 0);
  const canSubmit = isAmountValid && isGuaranteeValid && allGuarantorsValid && hasGuarantors;

  const interestAmount = parsedAmount * 0.05;

  const handleLookup = async () => {
    if (!lookupNumber.trim()) return;
    setIsLooking(true);
    try {
      const { data, error } = await supabase.rpc("lookup_member_by_number", {
        _membership_number: lookupNumber.trim(),
      });
      if (error) throw error;
      if (!data || (data as any).user_id === null) {
        toast({ title: "Not Found", description: "No active member with that number.", variant: "destructive" });
        setIsLooking(false);
        return;
      }
      const member = data as any as { user_id: string; display_name: string; membership_number: string };
      if (member.user_id === user?.id) {
        toast({ title: "Invalid", description: "You cannot guarantee your own loan.", variant: "destructive" });
        setIsLooking(false);
        return;
      }
      if (guarantors.find((g) => g.userId === member.user_id)) {
        toast({ title: "Already Added", description: "This member is already a guarantor.", variant: "destructive" });
        setIsLooking(false);
        return;
      }

      // Get their savings
      const { data: contribs } = await supabase
        .from("contributions")
        .select("amount")
        .eq("member_id", member.user_id);
      const savings = (contribs || []).reduce((sum, c) => sum + Number(c.amount), 0);

      setGuarantors((prev) => [
        ...prev,
        { userId: member.user_id, name: member.display_name, membershipNumber: member.membership_number, savings, amount: "" },
      ]);
      setLookupNumber("");
    } catch {
      toast({ title: "Error", description: "Failed to look up member.", variant: "destructive" });
    }
    setIsLooking(false);
  };

  const removeGuarantor = (userId: string) => {
    setGuarantors((prev) => prev.filter((g) => g.userId !== userId));
  };

  const updateGuarantorAmount = (userId: string, amount: string) => {
    setGuarantors((prev) => prev.map((g) => (g.userId === userId ? { ...g, amount } : g)));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Create loan
      const { data: loan, error: loanError } = await supabase
        .from("loans")
        .insert({ member_id: user.id, amount: parsedAmount, status: "pending_guarantors" as any, interest_rate: 5 })
        .select()
        .single();
      if (loanError) throw loanError;

      // Create guarantor entries
      const guarantorInserts = guarantors
        .filter((g) => parseFloat(g.amount) > 0)
        .map((g) => ({
          loan_id: loan.id,
          guarantor_id: g.userId,
          amount: parseFloat(g.amount),
        }));
      const { error: gError } = await supabase.from("loan_guarantors").insert(guarantorInserts);
      if (gError) throw gError;

      // Notify each guarantor
      const notifications = guarantors
        .filter((g) => parseFloat(g.amount) > 0)
        .map((g) => ({
          user_id: g.userId,
          type: "guarantor_request" as const,
          title: "Guarantee Request",
          message: `You have been asked to guarantee a loan of KES ${parsedAmount.toLocaleString()} with KES ${parseFloat(g.amount).toLocaleString()}.`,
          data: { loan_id: loan.id },
        }));
      await supabase.from("notifications").insert(notifications);

      toast({ title: "Loan Request Submitted", description: "Guarantors have been notified." });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setLoanAmount("");
    setGuarantors([]);
    setLookupNumber("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Request a Loan</DialogTitle>
          <DialogDescription>
            Enter amount and add guarantors by their membership number. Interest: 5%/month.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Eligibility */}
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-accent" />
              <span className="font-semibold">Your Loan Eligibility</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Savings</p>
                <p className="font-semibold">KES {totalSavings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max (5x)</p>
                <p className="font-semibold">KES {maxEligibility.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Loan</p>
                <p className="font-semibold">KES {currentLoanBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Available</p>
                <p className="font-semibold text-accent">KES {maxLoanAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Loan Amount (KES)</Label>
            <Input type="number" placeholder="Enter amount" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} max={maxLoanAmount} />
            {loanAmount && !isAmountValid && parsedAmount > maxLoanAmount && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Exceeds maximum eligible
              </p>
            )}
          </div>

          {/* Repayment Info */}
          {loanAmount && isAmountValid && (
            <div className="p-4 rounded-xl bg-muted/50 border">
              <p className="text-sm text-muted-foreground mb-2">First Month Summary</p>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-xs text-muted-foreground">Principal</p><p className="font-semibold">KES {parsedAmount.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Interest (5%)</p><p className="font-semibold text-warning">KES {interestAmount.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Total Due</p><p className="font-semibold text-primary">KES {(parsedAmount + interestAmount).toLocaleString()}</p></div>
              </div>
            </div>
          )}

          {/* Guarantors */}
          {loanAmount && isAmountValid && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Guarantors</Label>
                <Badge variant={isGuaranteeValid ? "default" : "destructive"}>
                  {isGuaranteeValid ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                  KES {totalGuarantee.toLocaleString()} / {requiredGuarantee.toLocaleString()} (80%)
                </Badge>
              </div>

              {/* Lookup */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter membership number (e.g. 12345)"
                  value={lookupNumber}
                  onChange={(e) => setLookupNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                />
                <Button variant="outline" onClick={handleLookup} disabled={isLooking}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Added guarantors */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {guarantors.map((g) => {
                  const v = guarantorValidations.find((v) => v.userId === g.userId);
                  const amt = parseFloat(g.amount) || 0;
                  return (
                    <div key={g.userId} className={`p-4 rounded-lg border ${amt > 0 && !v?.valid ? "bg-destructive/5 border-destructive/30" : amt > 0 ? "bg-primary/5 border-primary/30" : "bg-muted/50"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{g.name} <span className="text-muted-foreground text-xs">#{g.membershipNumber}</span></p>
                          <p className="text-xs text-muted-foreground">Max: KES {g.savings.toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeGuarantor(g.userId)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">KES</span>
                        <Input type="number" placeholder="Amount agreed" value={g.amount} onChange={(e) => updateGuarantorAmount(g.userId, e.target.value)} className="flex-1" max={g.savings} />
                      </div>
                      {amt > g.savings && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Exceeds member's savings
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isGuaranteeValid && requiredGuarantee > 0 && totalGuarantee > 0 && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Need KES {(requiredGuarantee - totalGuarantee).toLocaleString()} more
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="gold" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Submit Request</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoanRequestModal;
