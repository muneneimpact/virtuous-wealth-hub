import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, DollarSign, MessageSquare, Calendar, Info, CreditCard, PiggyBank } from "lucide-react";

interface PaymentSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthlyContribution?: number;
}

type PaymentType = "savings" | "loan_repayment" | "both";

const PaymentSubmissionModal = ({
  open, onOpenChange, monthlyContribution = 2000,
}: PaymentSubmissionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(monthlyContribution.toString());
  const [paymentType, setPaymentType] = useState<PaymentType>("savings");
  const [loanRepaymentAmount, setLoanRepaymentAmount] = useState("");
  const [paymentMonth, setPaymentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [mpesaCode, setMpesaCode] = useState("");
  const [mpesaMessage, setMpesaMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLoan, setActiveLoan] = useState<{ id: string; amount: number; repaid_amount: number; total_cost: number } | null>(null);

  // Load active loan info
  useEffect(() => {
    if (!open || !user?.id) return;
    const loadLoan = async () => {
      const { data } = await supabase
        .from("loans")
        .select("id, amount, repaid_amount, total_cost")
        .eq("member_id", user.id)
        .eq("status", "disbursed")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setActiveLoan(data[0]);
      } else {
        setActiveLoan(null);
        if (paymentType !== "savings") setPaymentType("savings");
      }
    };
    loadLoan();
  }, [open, user?.id]);

  const parsedAmount = parseFloat(amount) || 0;
  const parsedLoanRepayment = parseFloat(loanRepaymentAmount) || 0;
  const loanBalance = activeLoan ? (activeLoan.total_cost || activeLoan.amount) - activeLoan.repaid_amount : 0;

  // Cap loan repayment at actual balance - never overpay the loan
  const cappedLoanRepayment = Math.min(parsedLoanRepayment, loanBalance);
  const cappedFullLoanRepayment = Math.min(parsedAmount, loanBalance);

  // Calculate how much goes where
  const savingsAmount = paymentType === "loan_repayment" ? Math.max(0, parsedAmount - cappedFullLoanRepayment)
    : paymentType === "both" ? Math.max(0, parsedAmount - cappedLoanRepayment) 
    : parsedAmount;
  const loanAmount = paymentType === "savings" ? 0 
    : paymentType === "both" ? cappedLoanRepayment
    : cappedFullLoanRepayment;

  const handleSubmit = async () => {
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid Amount", variant: "destructive" });
      return;
    }
    if (!mpesaCode && !mpesaMessage) {
      toast({ title: "Required", description: "Enter M-Pesa code or message.", variant: "destructive" });
      return;
    }
    if (paymentType === "loan_repayment" && !activeLoan) {
      toast({ title: "No Active Loan", description: "You don't have an active loan to repay.", variant: "destructive" });
      return;
    }
    if (paymentType === "both" && parsedLoanRepayment <= 0) {
      toast({ title: "Required", description: "Enter loan repayment amount.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const notes = paymentType === "savings" 
        ? "Savings contribution" 
        : paymentType === "loan_repayment" 
        ? `Loan repayment (KES ${loanAmount.toLocaleString()})` 
        : `Split payment: Loan KES ${loanAmount.toLocaleString()}, Savings KES ${savingsAmount.toLocaleString()}`;

      const { error } = await (supabase.from("payment_requests") as any).insert({
        member_id: user!.id,
        amount: parsedAmount,
        payment_month: paymentMonth,
        payment_date: paymentDate,
        mpesa_code: mpesaCode || null,
        mpesa_message: mpesaMessage || null,
        status: "pending",
        payment_method: "mpesa",
        notes: JSON.stringify({
          payment_type: paymentType,
          total_amount: parsedAmount,
          loan_repayment_amount: loanAmount,
          savings_amount: savingsAmount,
          loan_id: activeLoan?.id || null,
          description: notes,
        }),
      });

      if (error) throw error;

      toast({
        title: "Payment Submitted",
        description: `KES ${parsedAmount.toLocaleString()} submitted for approval. ${notes}`,
      });

      setAmount(monthlyContribution.toString());
      setMpesaCode("");
      setMpesaMessage("");
      setLoanRepaymentAmount("");
      setPaymentType("savings");
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Submit Payment</DialogTitle>
          <DialogDescription>
            Submit your payment. Treasurer will verify against M-Pesa records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions Card */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm mb-1">How it works:</p>
                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. Send your payment to the group M-Pesa number</li>
                  <li>2. Choose payment type (savings, loan, or both)</li>
                  <li>3. Paste M-Pesa code or message</li>
                  <li>4. Submit for treasurer verification</li>
                </ol>
              </div>
            </div>
          </Card>

          {/* Payment Type Selection */}
          <div className="space-y-2">
            <Label className="font-semibold">What is this payment for?</Label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType("savings")}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                  paymentType === "savings" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <PiggyBank className={`w-5 h-5 ${paymentType === "savings" ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium text-sm">Savings Contribution</p>
                  <p className="text-xs text-muted-foreground">Full amount goes to your savings</p>
                </div>
              </button>

              {activeLoan && (
                <>
                  <button
                    type="button"
                    onClick={() => setPaymentType("loan_repayment")}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      paymentType === "loan_repayment" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 ${paymentType === "loan_repayment" ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium text-sm">Loan Repayment</p>
                      <p className="text-xs text-muted-foreground">Full amount goes to loan (balance: KES {loanBalance.toLocaleString()})</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType("both")}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      paymentType === "both" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <DollarSign className={`w-5 h-5 ${paymentType === "both" ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium text-sm">Both (Loan + Savings)</p>
                      <p className="text-xs text-muted-foreground">Split between loan repayment and savings</p>
                    </div>
                  </button>
                </>
              )}
            </div>

            {!activeLoan && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" /> No active loan — payment will go to savings.
              </p>
            )}
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Amount (KES)
            </Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="100"
            />
          </div>

          {/* Loan Repayment Amount (for split payments) */}
          {paymentType === "both" && (
            <div className="space-y-2">
              <Label>How much goes to loan repayment? (KES)</Label>
              <Input
                type="number"
                placeholder="Enter loan repayment portion"
                value={loanRepaymentAmount}
                onChange={(e) => setLoanRepaymentAmount(e.target.value)}
                min="0"
                max={Math.min(parsedAmount, loanBalance)}
              />
              <p className="text-xs text-muted-foreground">
                Remaining KES {Math.max(0, parsedAmount - parsedLoanRepayment).toLocaleString()} will go to savings
              </p>
            </div>
          )}

          {/* Payment Breakdown Summary */}
          {parsedAmount > 0 && (
            <Alert className="bg-muted/30 border-muted">
              <Info className="w-4 h-4" />
              <AlertDescription>
                <p className="font-semibold text-sm mb-2">Payment Breakdown:</p>
                <div className="space-y-1 text-sm">
                  {loanAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">→ Loan Repayment:</span>
                      <span className="font-semibold">KES {loanAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {savingsAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">→ Savings:</span>
                      <span className="font-semibold">KES {savingsAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <hr className="border-muted-foreground/20 my-1" />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>KES {parsedAmount.toLocaleString()}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Month */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Payment Month
            </Label>
            <Input
              type="month"
              value={paymentMonth}
              onChange={(e) => setPaymentMonth(e.target.value)}
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* M-Pesa Code */}
          <div className="space-y-2">
            <Label>M-Pesa Code (optional)</Label>
            <Input
              placeholder="e.g., LN3C7D7CCCC"
              value={mpesaCode}
              onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">The transaction confirmation code from your M-Pesa</p>
          </div>

          {/* M-Pesa Message */}
          <div className="space-y-2">
            <Label>M-Pesa Message (optional)</Label>
            <Textarea
              placeholder="Paste the complete M-Pesa message here if you don't have the code"
              value={mpesaMessage}
              onChange={(e) => setMpesaMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !amount} className="flex-1">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Payment
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSubmissionModal;
