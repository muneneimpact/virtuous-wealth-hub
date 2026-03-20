import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2, XCircle, Clock, User, Calendar, MessageSquare, CreditCard, PiggyBank, DollarSign,
} from "lucide-react";

interface PaymentRequest {
  id: string;
  member_id: string;
  amount: number;
  payment_month: string;
  payment_date: string;
  mpesa_code: string | null;
  mpesa_message: string | null;
  status: string;
  rejection_reason: string | null;
  submitted_at: string;
  notes: string | null;
  member_name?: string;
}

interface PaymentNotes {
  payment_type: "savings" | "loan_repayment" | "both";
  total_amount: number;
  loan_repayment_amount: number;
  savings_amount: number;
  loan_id: string | null;
  description: string;
}

function parsePaymentNotes(notes: string | null): PaymentNotes | null {
  if (!notes) return null;
  try {
    return JSON.parse(notes);
  } catch {
    return null;
  }
}

const PaymentApprovalsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

  const { data: paymentRequests = [] } = useQuery({
    queryKey: ["payment-requests"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("payment_requests") as any)
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      const memberIds = [...new Set((data || []).map((p: any) => p.member_id))];
      let profiles: any[] = [];
      if (memberIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", memberIds as string[]);
        profiles = profileData || [];
      }

      const memberMap = Object.fromEntries(profiles.map((p) => [p.user_id, p.display_name]));
      return (data || []).map((p: any) => ({ ...p, member_name: memberMap[p.member_id] || "Unknown" })) as PaymentRequest[];
    },
  });

  const pendingRequests = paymentRequests.filter((p) => p.status === "pending");
  const approvedRequests = paymentRequests.filter((p) => p.status === "approved");

  const handleApproveClick = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setApprovalDialogOpen(true);
  };

  const handleRejectClick = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setRejectionDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);

    try {
      const paymentInfo = parsePaymentNotes(selectedRequest.notes);
      const loanRepayAmount = paymentInfo?.loan_repayment_amount || 0;
      const savingsAmt = paymentInfo?.savings_amount || (loanRepayAmount > 0 ? selectedRequest.amount - loanRepayAmount : selectedRequest.amount);
      const loanId = paymentInfo?.loan_id || null;

      // 1. Mark payment as approved
      await (supabase.from("payment_requests") as any)
        .update({
          status: "approved",
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      // 2. Handle loan repayment portion
      if (loanRepayAmount > 0 && loanId) {
        // Get current loan data
        const { data: loan } = await supabase
          .from("loans")
          .select("id, amount, repaid_amount, total_cost, status")
          .eq("id", loanId)
          .single();

        if (loan && loan.status === "disbursed") {
          const totalOwed = (loan.total_cost || loan.amount) - loan.repaid_amount;
          const actualRepayment = Math.min(loanRepayAmount, totalOwed);
          const newRepaid = loan.repaid_amount + actualRepayment;
          const isFullyRepaid = newRepaid >= (loan.total_cost || loan.amount);

          await supabase
            .from("loans")
            .update({
              repaid_amount: newRepaid,
              status: isFullyRepaid ? "repaid" as any : "disbursed" as any,
            })
            .eq("id", loanId);

          // Record loan repayment transaction
          await supabase.from("transactions").insert({
            type: "loan_repayment",
            amount: actualRepayment,
            member_id: selectedRequest.member_id,
            description: `Loan repayment: KES ${actualRepayment.toLocaleString()} (M-Pesa: ${selectedRequest.mpesa_code || "verified"})${isFullyRepaid ? " — LOAN FULLY REPAID" : ""}`,
            created_by: user!.id,
            reference_id: loanId,
          });

          // Notify member about loan repayment
          await (supabase.from("notifications") as any).insert({
            user_id: selectedRequest.member_id,
            type: "contribution_approved" as any,
            title: isFullyRepaid ? "Loan Fully Repaid! 🎉" : "Loan Repayment Recorded",
            message: isFullyRepaid 
              ? `Congratulations! Your loan has been fully repaid. Final payment: KES ${actualRepayment.toLocaleString()}.`
              : `Loan repayment of KES ${actualRepayment.toLocaleString()} recorded. Remaining balance: KES ${((loan.total_cost || loan.amount) - newRepaid).toLocaleString()}.`,
          });
        }
      }

      // 3. Handle savings portion
      if (savingsAmt > 0) {
        // Record contribution
        await supabase.from("contributions").insert({
          member_id: selectedRequest.member_id,
          amount: savingsAmt,
          month: selectedRequest.payment_month,
          notes: `Payment approved - M-Pesa: ${selectedRequest.mpesa_code || "Message verified"}${loanRepayAmount > 0 ? ` (split: KES ${savingsAmt.toLocaleString()} savings)` : ""}`,
          recorded_by: user!.id,
        });

        // Update member's savings
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, savings")
          .eq("user_id", selectedRequest.member_id)
          .single();

        const currentSavings = (profile as any)?.savings || 0;
        
        await (supabase.from("profiles") as any)
          .update({
            savings: currentSavings + savingsAmt,
          })
          .eq("user_id", selectedRequest.member_id);

        // Record savings transaction
        await supabase.from("transactions").insert({
          type: "contribution",
          amount: savingsAmt,
          member_id: selectedRequest.member_id,
          description: `Savings contribution: KES ${savingsAmt.toLocaleString()}${loanRepayAmount > 0 ? " (from split payment)" : ""}`,
          created_by: user!.id,
        });

        // Notify about savings
        await (supabase.from("notifications") as any).insert({
          user_id: selectedRequest.member_id,
          type: "contribution_approved" as any,
          title: "Payment Approved",
          message: loanRepayAmount > 0 
            ? `Split payment approved: KES ${savingsAmt.toLocaleString()} added to savings, KES ${loanRepayAmount.toLocaleString()} applied to loan.`
            : `Your payment of KES ${savingsAmt.toLocaleString()} for ${selectedRequest.payment_month} has been approved and added to your savings.`,
        });
      }

      const summaryParts: string[] = [];
      if (savingsAmt > 0) summaryParts.push(`KES ${savingsAmt.toLocaleString()} → savings`);
      if (loanRepayAmount > 0) summaryParts.push(`KES ${loanRepayAmount.toLocaleString()} → loan`);

      toast({
        title: "Payment Approved",
        description: `${selectedRequest.member_name}: ${summaryParts.join(", ")}`,
      });

      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["all-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["group-financials"] });
      queryClient.invalidateQueries({ queryKey: ["my-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["member-financials"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });

      setApprovalDialogOpen(false);
      setSelectedRequest(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({ title: "Required", description: "Enter rejection reason.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);

    try {
      await (supabase.from("payment_requests") as any)
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      await (supabase.from("notifications") as any).insert({
        user_id: selectedRequest.member_id,
        type: "payment_rejected" as any,
        title: "Payment Not Approved",
        message: `Your payment of KES ${selectedRequest.amount.toLocaleString()} was not approved. Reason: ${rejectionReason}`,
      });

      toast({
        title: "Payment Rejected",
        description: `Notified ${selectedRequest.member_name}`,
      });

      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
      setRejectionDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const renderPaymentTypeInfo = (request: PaymentRequest) => {
    const info = parsePaymentNotes(request.notes);
    if (!info) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {info.savings_amount > 0 && (
          <Badge variant="secondary" className="text-xs gap-1">
            <PiggyBank className="w-3 h-3" /> Savings: KES {info.savings_amount.toLocaleString()}
          </Badge>
        )}
        {info.loan_repayment_amount > 0 && (
          <Badge variant="outline" className="text-xs gap-1">
            <CreditCard className="w-3 h-3" /> Loan: KES {info.loan_repayment_amount.toLocaleString()}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-warning" />
          <h3 className="font-display text-xl font-semibold">
            Pending Verification ({pendingRequests.length})
          </h3>
        </div>

        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No pending payments</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-warning/30 bg-warning/5 hover:bg-warning/10 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-warning/20">
                            <User className="w-5 h-5 text-warning" />
                          </div>
                          <div>
                            <p className="font-semibold">{request.member_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(request.submitted_at).toLocaleDateString("en-KE")}
                            </p>
                          </div>
                        </div>
                        <p className="font-display text-2xl font-bold text-warning">
                          KES {request.amount.toLocaleString()}
                        </p>
                      </div>

                      {renderPaymentTypeInfo(request)}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> Month
                          </p>
                          <p className="font-medium">{request.payment_month}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment Date</p>
                          <p className="font-medium">{request.payment_date}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" /> M-Pesa
                          </p>
                          <p className="font-mono font-medium">
                            {request.mpesa_code || "Message"}
                          </p>
                        </div>
                      </div>

                      {request.mpesa_message && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">M-Pesa Message:</p>
                          <p className="text-sm font-mono">{request.mpesa_message}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button onClick={() => handleApproveClick(request)} disabled={isProcessing} className="gap-2" size="sm">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </Button>
                      <Button onClick={() => handleRejectClick(request)} disabled={isProcessing} variant="destructive" size="sm" className="gap-2">
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {approvedRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="font-display text-lg font-semibold">
              Approved ({approvedRequests.length})
            </h3>
          </div>
          <div className="space-y-2">
            {approvedRequests.slice(0, 5).map((request) => (
              <Card key={request.id} className="bg-success/5">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium text-sm">{request.member_name}</p>
                      <p className="text-xs text-muted-foreground">{request.payment_month}</p>
                      {renderPaymentTypeInfo(request)}
                    </div>
                  </div>
                  <p className="font-semibold">KES {request.amount.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              {selectedRequest && `${selectedRequest.member_name} - KES ${selectedRequest.amount.toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Rejection</label>
              <Textarea
                placeholder="E.g., M-Pesa code not found in bank records, amount mismatch, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setRejectionDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()} variant="destructive" className="flex-1">
                {isProcessing ? "Rejecting..." : "Reject Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              {selectedRequest && `${selectedRequest.member_name} - KES ${selectedRequest.amount.toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-2">Payment Details:</p>
              <div className="space-y-2 text-sm">
                {selectedRequest && (() => {
                  const info = parsePaymentNotes(selectedRequest.notes);
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Month:</span>
                        <span className="font-semibold">{selectedRequest.payment_month}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-semibold">KES {selectedRequest.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>M-Pesa Code:</span>
                        <span className="font-mono">{selectedRequest.mpesa_code || "-"}</span>
                      </div>
                      {info && (
                        <>
                          <hr className="border-muted-foreground/20" />
                          <p className="font-semibold text-xs text-muted-foreground">Breakdown:</p>
                          {info.savings_amount > 0 && (
                            <div className="flex justify-between">
                              <span className="flex items-center gap-1"><PiggyBank className="w-3 h-3" /> Savings:</span>
                              <span className="font-semibold text-green-700">KES {info.savings_amount.toLocaleString()}</span>
                            </div>
                          )}
                          {info.loan_repayment_amount > 0 && (
                            <div className="flex justify-between">
                              <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Loan Repayment:</span>
                              <span className="font-semibold text-blue-700">KES {info.loan_repayment_amount.toLocaleString()}</span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {(() => {
                if (!selectedRequest) return "";
                const info = parsePaymentNotes(selectedRequest.notes);
                if (info && info.loan_repayment_amount > 0 && info.savings_amount > 0) {
                  return `Approving will add KES ${info.savings_amount.toLocaleString()} to savings and apply KES ${info.loan_repayment_amount.toLocaleString()} to the loan.`;
                }
                if (info && info.loan_repayment_amount > 0) {
                  return `Approving will apply KES ${info.loan_repayment_amount.toLocaleString()} to the member's loan repayment.`;
                }
                return `Approving will add KES ${selectedRequest.amount.toLocaleString()} to the member's savings.`;
              })()}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setApprovalDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleApprove} disabled={isProcessing} className="flex-1">
                {isProcessing ? "Approving..." : "Approve Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentApprovalsPanel;
