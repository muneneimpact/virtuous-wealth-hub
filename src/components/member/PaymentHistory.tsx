import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyPaymentRequests } from "@/hooks/useAppData";
import { Clock, CheckCircle2, XCircle, PiggyBank, CreditCard, DollarSign, Receipt } from "lucide-react";

interface PaymentNotes {
  payment_type: "savings" | "loan_repayment" | "both";
  total_amount: number;
  loan_repayment_amount: number;
  savings_amount: number;
  loan_id: string | null;
  description: string;
}

function parseNotes(notes: string | null): PaymentNotes | null {
  if (!notes) return null;
  try {
    return JSON.parse(notes);
  } catch {
    return null;
  }
}

const PaymentHistory = () => {
  const { data: requests = [] } = useMyPaymentRequests();

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "rejected": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  if (requests.length === 0) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-muted-foreground">No payment submissions yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Payment History
          <Badge variant="secondary" className="ml-auto">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((req: any) => {
            const info = parseNotes(req.notes);
            return (
              <div key={req.id} className="p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {statusIcon(req.status)}
                    <span className="font-semibold">KES {Number(req.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColor(req.status) as any} className="capitalize">
                      {req.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.submitted_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Payment Split Breakdown */}
                {info ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    {info.savings_amount > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/15">
                        <PiggyBank className="w-4 h-4 text-success flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Savings</p>
                          <p className="font-semibold text-success">KES {info.savings_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {info.loan_repayment_amount > 0 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/15">
                        <CreditCard className="w-4 h-4 text-warning flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Loan Repayment</p>
                          <p className="font-semibold text-warning">KES {info.loan_repayment_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/15">
                      <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-semibold capitalize">{info.payment_type.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{req.notes || "Savings contribution"}</p>
                )}

                {/* M-Pesa info */}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {req.mpesa_code && <span className="font-mono">M-Pesa: {req.mpesa_code}</span>}
                  <span>Month: {req.payment_month}</span>
                </div>

                {/* Rejection reason */}
                {req.status === "rejected" && req.rejection_reason && (
                  <div className="mt-2 p-2 rounded bg-destructive/5 border border-destructive/20 text-sm text-destructive">
                    Reason: {req.rejection_reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;
