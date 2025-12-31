import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Calculator, 
  Users,
  Banknote,
  Minus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: number;
  name: string;
  totalInvested: number;
  loanBalance: number;
}

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
}

interface LoanApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: LoanRequest | null;
  availableBalance: number;
  minimumBalance: number;
  onApprove: (requestId: number, processingFee: number, deductFromLoan: boolean) => void;
  onReject: (requestId: number, reason: string) => void;
}

const LoanApprovalModal = ({
  open,
  onOpenChange,
  request,
  availableBalance,
  minimumBalance,
  onApprove,
  onReject,
}: LoanApprovalModalProps) => {
  const { toast } = useToast();
  const [processingFee, setProcessingFee] = useState<string>("0");
  const [deductFromLoan, setDeductFromLoan] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) return null;

  const totalGuarantee = request.guarantors.reduce((sum, g) => sum + g.amount, 0);
  const requiredGuarantee = request.amount * 0.8;
  const isGuaranteeValid = totalGuarantee >= requiredGuarantee;
  
  // Check if all guarantor amounts are within their savings
  const guarantorValidations = request.guarantors.map(g => ({
    ...g,
    isValid: g.amount <= g.memberSavings,
    percentage: ((g.amount / g.memberSavings) * 100).toFixed(0)
  }));
  const allGuarantorsValid = guarantorValidations.every(g => g.isValid);

  // Calculate disbursement
  const fee = parseFloat(processingFee) || 0;
  const disbursementAmount = deductFromLoan ? request.amount - fee : request.amount;
  const balanceAfterDisbursement = availableBalance - disbursementAmount;
  const canDisburse = balanceAfterDisbursement >= minimumBalance;

  // Interest calculation (5% per month)
  const interestAmount = request.amount * 0.05;
  const totalRepayment = request.amount + interestAmount;

  const handleApprove = async () => {
    if (!canDisburse) {
      toast({
        title: "Cannot Approve",
        description: `Disbursement would leave balance below KES ${minimumBalance.toLocaleString()} minimum.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    onApprove(request.id, fee, deductFromLoan);
    
    toast({
      title: "Loan Approved",
      description: `KES ${disbursementAmount.toLocaleString()} will be disbursed to ${request.memberName}`,
    });
    
    setIsProcessing(false);
    onOpenChange(false);
    resetForm();
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    onReject(request.id, rejectionReason);
    
    toast({
      title: "Loan Rejected",
      description: `Loan request from ${request.memberName} has been rejected.`,
    });
    
    setIsProcessing(false);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setProcessingFee("0");
    setDeductFromLoan(true);
    setRejectionReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Review Loan Request</DialogTitle>
          <DialogDescription>
            Verify guarantor information and decide on this loan request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Request Summary */}
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Requested by</p>
                <p className="font-display text-xl font-semibold">{request.memberName}</p>
              </div>
              <Badge variant="secondary">
                {new Date(request.requestDate).toLocaleDateString("en-KE")}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Loan Amount</p>
                <p className="font-semibold text-lg">KES {request.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Member Savings</p>
                <p className="font-semibold">KES {request.memberSavings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max Eligible (5x)</p>
                <p className="font-semibold text-accent">KES {(request.memberSavings * 5).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Interest (5%/mo)</p>
                <p className="font-semibold text-warning">KES {interestAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Guarantor Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Guarantors ({request.guarantors.length})
              </Label>
              <Badge variant={isGuaranteeValid && allGuarantorsValid ? "default" : "destructive"}>
                {isGuaranteeValid && allGuarantorsValid ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : (
                  <AlertTriangle className="w-3 h-3 mr-1" />
                )}
                Total: KES {totalGuarantee.toLocaleString()} / {requiredGuarantee.toLocaleString()} (80%)
              </Badge>
            </div>

            <div className="space-y-2">
              {guarantorValidations.map((g) => (
                <div
                  key={g.memberId}
                  className={`p-4 rounded-lg border ${
                    g.isValid ? "bg-muted/50" : "bg-destructive/5 border-destructive/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{g.memberName}</p>
                      <p className="text-sm text-muted-foreground">
                        Savings: KES {g.memberSavings.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">KES {g.amount.toLocaleString()}</p>
                      <p className={`text-xs ${g.isValid ? "text-muted-foreground" : "text-destructive"}`}>
                        {g.percentage}% of savings
                      </p>
                    </div>
                  </div>
                  {!g.isValid && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Guarantee exceeds member's savings!
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bank Balance Check */}
          <div className={`p-4 rounded-xl border ${canDisburse ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-5 h-5" />
              <span className="font-semibold">Bank Balance Check</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Available Balance</p>
                <p className="font-semibold">KES {availableBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">After Disbursement</p>
                <p className={`font-semibold ${canDisburse ? "text-success" : "text-destructive"}`}>
                  KES {balanceAfterDisbursement.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Minimum Required</p>
                <p className="font-semibold">KES {minimumBalance.toLocaleString()}</p>
              </div>
            </div>
            {!canDisburse && (
              <p className="text-sm text-destructive mt-3 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Cannot approve: would leave balance below minimum. All members must vote to reduce minimum.
              </p>
            )}
          </div>

          {/* Processing Fee */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Processing Fee (Optional)
            </Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Enter processing fee"
                  value={processingFee}
                  onChange={(e) => setProcessingFee(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="deductFromLoan" 
                  checked={deductFromLoan}
                  onCheckedChange={(checked) => setDeductFromLoan(checked === true)}
                />
                <Label htmlFor="deductFromLoan" className="text-sm cursor-pointer">
                  Deduct from loan
                </Label>
              </div>
            </div>
            {parseFloat(processingFee) > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex items-center justify-between">
                  <span>Loan Amount:</span>
                  <span>KES {request.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Minus className="w-3 h-3" /> Processing Fee:
                  </span>
                  <span>KES {(parseFloat(processingFee) || 0).toLocaleString()}</span>
                </div>
                <hr className="my-2 border-border" />
                <div className="flex items-center justify-between font-semibold">
                  <span>Member Receives:</span>
                  <span className="text-primary">KES {disbursementAmount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Rejection Reason (if rejecting) */}
          <div className="space-y-2">
            <Label>Rejection Reason (if rejecting)</Label>
            <Input
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isProcessing}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            variant="gold"
            onClick={handleApprove}
            disabled={!canDisburse || !isGuaranteeValid || !allGuarantorsValid || isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Approve & Disburse
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoanApprovalModal;
