import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  User, 
  Users, 
  ArrowRight, 
  CheckCircle2,
  AlertTriangle 
} from "lucide-react";

interface GuarantorInfo {
  memberId: number;
  memberName: string;
  amount: number;
  memberSavings: number;
}

interface LoanRequest {
  id: number;
  memberId: number;
  memberName: string;
  amount: number;
  memberSavings: number;
  guarantors: GuarantorInfo[];
  requestDate: string;
  status: "pending" | "approved" | "rejected";
}

interface PendingLoanRequestsProps {
  requests: LoanRequest[];
  onReviewRequest: (request: LoanRequest) => void;
}

const PendingLoanRequests = ({ requests, onReviewRequest }: PendingLoanRequestsProps) => {
  const pendingRequests = requests.filter(r => r.status === "pending");

  if (pendingRequests.length === 0) {
    return (
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Loan Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pending loan requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="gold">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Loan Requests
          </span>
          <Badge variant="secondary">{pendingRequests.length} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const totalGuarantee = request.guarantors.reduce((sum, g) => sum + g.amount, 0);
            const requiredGuarantee = request.amount * 0.8;
            const isGuaranteeValid = totalGuarantee >= requiredGuarantee;
            const maxLoan = request.memberSavings * 5;
            const isAmountValid = request.amount <= maxLoan;

            return (
              <div
                key={request.id}
                className="p-4 rounded-xl bg-background border hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {request.memberName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{request.memberName}</p>
                      <p className="text-sm text-muted-foreground">
                        Savings: KES {request.memberSavings.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold">
                      KES {request.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.requestDate).toLocaleDateString("en-KE")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={isAmountValid ? "default" : "destructive"}>
                    {isAmountValid ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                    {isAmountValid ? "Within 5x limit" : "Exceeds 5x limit"}
                  </Badge>
                  <Badge variant={isGuaranteeValid ? "default" : "destructive"}>
                    <Users className="w-3 h-3 mr-1" />
                    {request.guarantors.length} guarantors ({((totalGuarantee / request.amount) * 100).toFixed(0)}%)
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Guarantee: KES {totalGuarantee.toLocaleString()} / {requiredGuarantee.toLocaleString()}
                  </div>
                  <Button 
                    variant="gold" 
                    size="sm"
                    onClick={() => onReviewRequest(request)}
                  >
                    Review
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingLoanRequests;
