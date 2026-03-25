import { useState, useMemo, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Calculator, Users, Send, Search, X, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  getMemberFinancials,
  calculateSelfGuaranteeLimit,
  createGuarantorNotification,
} from "@/lib/loanCalculations";

interface GuarantorEntry {
  userId: string;
  name: string;
  membershipNumber: string;
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
  const [repaymentMonths, setRepaymentMonths] = useState("12");
  const [guarantors, setGuarantors] = useState<GuarantorEntry[]>([]);
  const [lookupNumber, setLookupNumber] = useState("");
  const [isLooking, setIsLooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interestRate, setInterestRate] = useState(5);
  const [isSelfGuaranteeEligible, setIsSelfGuaranteeEligible] = useState(false);
  const [selfGuaranteeLimit, setSelfGuaranteeLimit] = useState(0);
  const [amountRequiringGuarantors, setAmountRequiringGuarantors] = useState(0);
  const [loadingFinancials, setLoadingFinancials] = useState(false);

  const maxEligibility = totalSavings * 5;
  const parsedAmount = parseFloat(loanAmount) || 0;
  const parsedMonths = parseInt(repaymentMonths) || 12;
  
  // Block borrowing if active loan exists and loan balance >= savings
  const hasBlockingLoan = currentLoanBalance > 0 && currentLoanBalance >= totalSavings;
  
  let tieredInterestRate = interestRate;
  if (parsedMonths >= 6 && parsedAmount > 50000) {
    tieredInterestRate = 1.5;
  }
  
  const estimatedInterest = (parsedAmount * tieredInterestRate * parsedMonths) / 100;
  const totalLoanCost = parsedAmount + estimatedInterest;
  const monthlyPayment = totalLoanCost / parsedMonths;
  
  const totalGuarantee = guarantors.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
  const isAmountValid = parsedAmount > 0 && parsedAmount <= maxLoanAmount;

  useEffect(() => {
    if (!open || parsedAmount <= 0 || !user?.id) {
      setSelfGuaranteeLimit(0);
      setAmountRequiringGuarantors(0);
      setIsSelfGuaranteeEligible(false);
      return;
    }

    const loadFinancials = async () => {
      setLoadingFinancials(true);
      try {
        const financials = await getMemberFinancials(user.id);
        setInterestRate(financials.interestRate);

        const { limit, isEligible } = 
          calculateSelfGuaranteeLimit(
            financials.totalSavings,
            parsedAmount,
            financials.interestRate
          );

        setSelfGuaranteeLimit(limit);
        setIsSelfGuaranteeEligible(isEligible);
        setAmountRequiringGuarantors(Math.max(0, parsedAmount - limit));
      } catch (error) {
        console.error("Error loading financials:", error);
      } finally {
        setLoadingFinancials(false);
      }
    };

    loadFinancials();
  }, [open, parsedAmount, user?.id]);

  // Simplified validation: each guarantor has amount > 0, total covers requirement
  const allGuarantorsHaveAmount = guarantors.length === 0 || guarantors.every((g) => parseFloat(g.amount) > 0);
  const isGuaranteeValid = isSelfGuaranteeEligible || (amountRequiringGuarantors > 0 && totalGuarantee >= amountRequiringGuarantors && allGuarantorsHaveAmount);
  const canSubmit = isAmountValid && isGuaranteeValid && !loadingFinancials && !hasBlockingLoan;

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

      setGuarantors((prev) => [
        ...prev,
        { 
          userId: member.user_id, 
          name: member.display_name, 
          membershipNumber: member.membership_number, 
          amount: "" 
        },
      ]);
      setLookupNumber("");
      toast({ title: "Added", description: `${member.display_name} added as guarantor.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to look up member.", variant: "destructive" });
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
      const loanStatus = isSelfGuaranteeEligible ? "pending_approval" : "pending_guarantors";
      const { data: loan, error: loanError } = await supabase
        .from("loans")
        .insert({ 
          member_id: user.id, 
          amount: parsedAmount, 
          status: loanStatus,
          interest_rate: tieredInterestRate,
          repayment_months: parsedMonths,
          total_interest: estimatedInterest,
          total_cost: totalLoanCost,
          monthly_payment: monthlyPayment,
        })
        .select()
        .single();
      if (loanError) throw loanError;

      if (!isSelfGuaranteeEligible && guarantors.length > 0) {
        const guarantorInserts = guarantors
          .filter((g) => parseFloat(g.amount) > 0)
          .map((g) => ({
            loan_id: loan.id,
            guarantor_id: g.userId,
            amount: parseFloat(g.amount),
          }));
        const { error: gError } = await supabase.from("loan_guarantors").insert(guarantorInserts);
        if (gError) throw gError;

        const guarantorList = guarantors.filter((g) => parseFloat(g.amount) > 0);
        for (const guarantor of guarantorList) {
          await createGuarantorNotification(
            guarantor.userId,
            user.user_metadata?.full_name || "Member",
            parsedAmount,
            parseFloat(guarantor.amount)
          );
        }
      }

      const successMessage = isSelfGuaranteeEligible 
        ? "Loan request submitted! Self-guarantee is available, moving to treasurer approval."
        : "Loan request submitted! Guarantors have been notified.";

      toast({ title: "Loan Request Submitted", description: successMessage });
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
    setRepaymentMonths("12");
    setGuarantors([]);
    setLookupNumber("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
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

          {/* Amount and Repayment Months */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Loan Amount (KES)</Label>
              <Input type="number" placeholder="Enter amount" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} max={maxLoanAmount} />
              {loanAmount && !isAmountValid && parsedAmount > maxLoanAmount && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Exceeds maximum eligible
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Repayment Period (Months)</Label>
              <select 
                value={repaymentMonths} 
                onChange={(e) => setRepaymentMonths(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {parsedMonths >= 6 && parsedAmount > 50000 ? "✓ Qualified for reduced interest (18% p.a.)" : ""}
              </p>
            </div>
          </div>

          {/* Repayment Info and Self-Guarantee Status */}
          {loanAmount && isAmountValid && (
            <>
              <div className="p-4 rounded-xl bg-muted/50 border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Repayment Summary</p>
                  {parsedMonths >= 6 && parsedAmount > 50000 && (
                    <Badge className="bg-green-600 text-white">Reduced Interest Rate</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div><p className="text-xs text-muted-foreground">Principal</p><p className="font-semibold">KES {parsedAmount.toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Rate</p><p className="font-semibold">{tieredInterestRate}%/mo</p></div>
                    <div><p className="text-xs text-muted-foreground">Period</p><p className="font-semibold">{parsedMonths} months</p></div>
                    <div><p className="text-xs text-muted-foreground">Total Interest</p><p className="font-semibold text-warning">KES {estimatedInterest.toLocaleString()}</p></div>
                  </div>
                  <hr className="border-muted-foreground/20" />
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div><p className="text-xs text-muted-foreground">Total Cost</p><p className="font-display text-lg font-bold">KES {totalLoanCost.toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Monthly Payment</p><p className="font-semibold text-primary">KES {monthlyPayment.toLocaleString()}</p></div>
                  </div>
                </div>
              </div>

              {/* Self-Guarantee Status */}
              <Alert className={isSelfGuaranteeEligible ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}>
                <div className="flex items-start gap-3">
                  {isSelfGuaranteeEligible ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {isSelfGuaranteeEligible ? "Self Guarantee Available" : "Guarantors Required"}
                    </p>
                    <AlertDescription className="text-xs mt-1">
                      {isSelfGuaranteeEligible ? (
                        <>Your savings are sufficient to cover this loan. No guarantors needed. Loan will move directly to treasurer approval.</>
                      ) : (
                        <>
                          Your self-guarantee limit is KES {selfGuaranteeLimit.toLocaleString()}.
                          You need guarantors to cover KES {amountRequiringGuarantors.toLocaleString()}.
                        </>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </>
          )}

          {/* Guarantors Section - Only show if not self-guaranteed */}
          {loanAmount && isAmountValid && !isSelfGuaranteeEligible && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Guarantors</Label>
                <Badge variant={amountRequiringGuarantors > 0 && totalGuarantee >= amountRequiringGuarantors ? "default" : totalGuarantee > 0 ? "secondary" : "destructive"}>
                  {totalGuarantee >= amountRequiringGuarantors && amountRequiringGuarantors > 0 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      KES {totalGuarantee.toLocaleString()} / {amountRequiringGuarantors.toLocaleString()}
                    </>
                  ) : amountRequiringGuarantors > 0 ? (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Need KES {(amountRequiringGuarantors - totalGuarantee).toLocaleString()} more
                    </>
                  ) : (
                    <>No guarantors needed</>
                  )}
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

              {/* Info about how it works */}
              <Alert className="bg-muted/30 border-muted">
                <Info className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  Enter how much you'd like each guarantor to cover. They will receive your request and decide whether to accept based on their available capacity.
                </AlertDescription>
              </Alert>

              {/* Added guarantors */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {guarantors.map((g) => {
                  const amt = parseFloat(g.amount) || 0;
                  return (
                    <div key={g.userId} className={`p-4 rounded-lg border transition-colors ${amt > 0 ? "bg-green-50 border-green-300" : "bg-muted/50"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{g.name}</p>
                          <p className="text-xs text-muted-foreground">Membership: #{g.membershipNumber}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeGuarantor(g.userId)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Requested Amount (KES)</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">KES</span>
                          <Input type="number" placeholder="0" value={g.amount} onChange={(e) => updateGuarantorAmount(g.userId, e.target.value)} className={`flex-1 text-lg font-semibold ${amt > 0 ? "border-green-500 bg-green-50" : ""}`} />
                        </div>
                      </div>
                      {amt > 0 && (
                        <div className="mt-3 p-2 rounded-lg flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <p className="text-xs text-green-700">Will request KES {amt.toLocaleString()} from this guarantor</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {amountRequiringGuarantors > 0 && totalGuarantee < amountRequiringGuarantors && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Still need KES {(amountRequiringGuarantors - totalGuarantee).toLocaleString()} in guarantees
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
