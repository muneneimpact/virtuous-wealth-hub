import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Users, AlertCircle, Info, Clock, User, DollarSign } from "lucide-react";
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
        title: status === "accepted" ? "Guarantee Accepted" : "Guarantee Declined",
        message: `Your guarantee request has been ${status}.`,
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

  // Separate pending and responded requests
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const respondedRequests = requests.filter((r) => r.status !== "pending");

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Guarantor Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">Loading requests...</div>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Guarantor Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You have no guarantee requests at this time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Guarantor Requests
          </span>
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {pendingRequests.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Pending Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-blue-50 border border-blue-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="font-semibold">{req.borrower_name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Membership: #{req.borrower_membership}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-white/60">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Loan Amount</p>
                      <p className="font-semibold text-sm">
                        KES {req.loan_amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Your Guarantee</p>
                      <p className="font-semibold text-sm text-blue-600 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        KES {Number(req.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleRespond(req.id, req.loan_member_id, "accepted")}
                      disabled={processingId === req.id}
                    >
                      {processingId === req.id ? (
                        <>
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Accept Guarantee
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
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
          </div>
        )}

        {/* Responded Requests */}
        {respondedRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Responded Requests ({respondedRequests.length})
            </h3>
            <div className="space-y-2">
              {respondedRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-3 rounded-lg border ${
                    req.status === "accepted"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{req.borrower_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Your guarantee: KES {Number(req.amount).toLocaleString()}
                      </p>
                    </div>
                    {req.status === "accepted" ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Accepted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-xs font-medium text-red-600">Declined</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuarantorRequestsInbox;
