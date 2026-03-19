import { useState } from "react";
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
import { Send, DollarSign, MessageSquare, Calendar } from "lucide-react";

interface PaymentSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthlyContribution?: number;
}

const PaymentSubmissionModal = ({
  open, onOpenChange, monthlyContribution = 2000,
}: PaymentSubmissionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(monthlyContribution.toString());
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

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Invalid Amount", variant: "destructive" });
      return;
    }
    if (!mpesaCode && !mpesaMessage) {
      toast({ title: "Required", description: "Enter M-Pesa code or message.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from("payment_requests") as any).insert({
        member_id: user!.id,
        amount: parsedAmount,
        payment_month: paymentMonth,
        payment_date: paymentDate,
        mpesa_code: mpesaCode || null,
        mpesa_message: mpesaMessage || null,
        status: "pending",
      });

      if (error) throw error;

      // Create notification for treasurer
      await (supabase.from("notifications") as any).insert({
        user_id: user!.id,
        type: "contribution_submitted",
        title: "Payment Submitted",
        message: `Payment of KES ${parsedAmount.toLocaleString()} submitted for approval. M-Pesa: ${mpesaCode || "Message provided"}`,
        data: { payment_month: paymentMonth, amount: parsedAmount },
      });

      toast({
        title: "Payment Submitted",
        description: `KES ${parsedAmount.toLocaleString()} submitted for approval. Treasurer will verify against bank records.`,
      });

      setAmount(monthlyContribution.toString());
      setMpesaCode("");
      setMpesaMessage("");
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
            Submit your contribution payment. Treasurer will verify against M-Pesa records in your bank account.
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
                  <li>2. Fill in the payment details below</li>
                  <li>3. Paste M-Pesa code or message</li>
                  <li>4. Submit for treasurer verification</li>
                </ol>
              </div>
            </div>
          </Card>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount (KES)
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
              maxLength="15"
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
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount}
              className="flex-1"
            >
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
