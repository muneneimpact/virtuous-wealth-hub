import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Users, AlertCircle } from "lucide-react";
import { useMyGuarantorRequests } from "@/hooks/useAppData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const GuarantorRequestsInbox = () => {
  const { user } = useAuth();
  const { data: requests = [], isLoading } = useMyGuarantorRequests();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleRespond = async (requestId: string, loanMemberId: string, status: "accepted" | "declined") => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from("loan_guarantors")
        .update({ status, responded_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      // Notify borrower
      const req = requests.find((r) => r.id === requestId);
      await supabase.from("notifications").insert({
        user_id: loanMemberId,
        type: status === "accepted" ? "guarantor_accepted" : "guarantor_declined",
        title: status === "accepted" ? "Guarantor Accepted" : "Guarantor Declined",
        message: `Your guarantee request has been ${status} by a member.`,
        data: { loan_guarantor_id: requestId },
      });

      toast({
        title: status === "accepted" ? "Guarantee Accepted" : "Guarantee Declined",
        description:
          status === "accepted"
            ? "You have accepted the guarantee request."
            : "You have declined the guarantee request.",
      });

      queryClient.invalidateQueries({ queryKey: ["my-guarantor-requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to respond to guarantee request.",
        variant: "destructive",
      });
    }
    setProcessingId(null);
  };

  if (isLoading || requests.length === 0) return null;

  return (
    <Card variant="gold" className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Guarantor Requests
          </span>
          <Badge variant="secondary">{requests.length} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-background border hover:border-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{req.borrower_name}</p>
                  <p className="text-sm text-muted-foreground">
                    #{req.borrower_membership}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Loan Amount</p>
                  <p className="font-display text-lg font-bold">
                    KES {req.loan_amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your guarantee amount</span>
                  <span className="font-semibold text-accent">
                    KES {Number(req.amount).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => handleRespond(req.id, req.loan_member_id, "accepted")}
                  disabled={processingId === req.id}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleRespond(req.id, req.loan_member_id, "declined")}
                  disabled={processingId === req.id}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GuarantorRequestsInbox;
