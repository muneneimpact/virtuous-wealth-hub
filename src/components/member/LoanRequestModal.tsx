import { useState, useMemo } from "react";
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
import { AlertTriangle, CheckCircle2, Calculator, Users, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: number;
  name: string;
  totalInvested: number;
  loanBalance: number;
}

interface GuarantorSelection {
  memberId: number;
  amount: number;
}

interface LoanRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMember: Member;
  allMembers: Member[];
  onSubmitRequest: (request: {
    amount: number;
    guarantors: GuarantorSelection[];
  }) => void;
}

const LoanRequestModal = ({
  open,
  onOpenChange,
  currentMember,
  allMembers,
  onSubmitRequest,
}: LoanRequestModalProps) => {
  const { toast } = useToast();
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [guarantorAmounts, setGuarantorAmounts] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loan eligibility: Max 5x contribution
  const maxLoanAmount = currentMember.totalInvested * 5;
  
  // Required guarantee: 80% of loan amount
  const requiredGuarantee = parseFloat(loanAmount) * 0.8 || 0;
  
  // Calculate total guarantee from entered amounts
  const totalGuaranteeEntered = useMemo(() => {
    return Object.values(guarantorAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
  }, [guarantorAmounts]);

  const isGuaranteeValid = totalGuaranteeEntered >= requiredGuarantee;
  const isAmountValid = parseFloat(loanAmount) > 0 && parseFloat(loanAmount) <= maxLoanAmount;
  
  // Validate each guarantor amount doesn't exceed their savings
  const guarantorValidations = useMemo(() => {
    const validations: Record<number, { valid: boolean; message: string }> = {};
    Object.entries(guarantorAmounts).forEach(([memberId, amount]) => {
      const member = allMembers.find(m => m.id === parseInt(memberId));
      if (member && parseFloat(amount) > 0) {
        if (parseFloat(amount) > member.totalInvested) {
          validations[parseInt(memberId)] = {
            valid: false,
            message: `Exceeds ${member.name}'s savings (KES ${member.totalInvested.toLocaleString()})`
          };
        } else {
          validations[parseInt(memberId)] = { valid: true, message: '' };
        }
      }
    });
    return validations;
  }, [guarantorAmounts, allMembers]);

  const allGuarantorsValid = Object.values(guarantorValidations).every(v => v.valid);
  const hasGuarantors = Object.values(guarantorAmounts).some(amt => parseFloat(amt) > 0);
  
  const canSubmit = isAmountValid && isGuaranteeValid && allGuarantorsValid && hasGuarantors;

  // Interest at 5% per month
  const interestAmount = parseFloat(loanAmount) * 0.05 || 0;
  const totalRepayment = parseFloat(loanAmount) + interestAmount || 0;

  const availableGuarantors = allMembers.filter(m => m.id !== currentMember.id);

  const handleGuarantorAmountChange = (memberId: number, amount: string) => {
    setGuarantorAmounts(prev => ({
      ...prev,
      [memberId]: amount
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const guarantors: GuarantorSelection[] = Object.entries(guarantorAmounts)
      .filter(([_, amt]) => parseFloat(amt) > 0)
      .map(([memberId, amount]) => ({
        memberId: parseInt(memberId),
        amount: parseFloat(amount)
      }));

    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    onSubmitRequest({
      amount: parseFloat(loanAmount),
      guarantors
    });
    
    toast({
      title: "Loan Request Submitted",
      description: "Your loan request has been sent to the Treasurer for approval.",
    });
    
    setIsSubmitting(false);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setLoanAmount("");
    setGuarantorAmounts({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Request a Loan</DialogTitle>
          <DialogDescription>
            Enter the amount and select members who agreed to guarantee your loan. Interest rate is 5% per month.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Eligibility Info */}
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-accent" />
              <span className="font-semibold">Your Loan Eligibility</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Your Savings</p>
                <p className="font-semibold">KES {currentMember.totalInvested.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max Loan (5x)</p>
                <p className="font-semibold text-accent">KES {maxLoanAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Loan</p>
                <p className="font-semibold">KES {currentMember.loanBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Interest Rate</p>
                <p className="font-semibold">5% /month</p>
              </div>
            </div>
          </div>

          {/* Loan Amount */}
          <div className="space-y-2">
            <Label htmlFor="loanAmount">Loan Amount (KES)</Label>
            <Input
              id="loanAmount"
              type="number"
              placeholder="Enter loan amount"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              max={maxLoanAmount}
            />
            {loanAmount && !isAmountValid && parseFloat(loanAmount) > maxLoanAmount && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Amount exceeds your maximum eligible (KES {maxLoanAmount.toLocaleString()})
              </p>
            )}
          </div>

          {/* Repayment Info */}
          {loanAmount && isAmountValid && (
            <div className="p-4 rounded-xl bg-muted/50 border">
              <p className="text-sm text-muted-foreground mb-2">Repayment Summary (First Month)</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Principal</p>
                  <p className="font-semibold">KES {parseFloat(loanAmount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interest (5%/mo)</p>
                  <p className="font-semibold text-warning">KES {interestAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Due</p>
                  <p className="font-semibold text-primary">KES {totalRepayment.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Guarantor Selection with Amounts */}
          {loanAmount && isAmountValid && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Select Guarantors & Enter Agreed Amounts
                </Label>
                <Badge variant={isGuaranteeValid ? "default" : "destructive"}>
                  {isGuaranteeValid ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  KES {totalGuaranteeEntered.toLocaleString()} / {requiredGuarantee.toLocaleString()} (80%)
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Enter the amount each member agreed to guarantee. Total must be at least 80% of loan amount.
              </p>
              
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {availableGuarantors.map((guarantor) => {
                  const enteredAmount = guarantorAmounts[guarantor.id] || "";
                  const validation = guarantorValidations[guarantor.id];
                  
                  return (
                    <div
                      key={guarantor.id}
                      className={`p-4 rounded-lg border transition-all ${
                        parseFloat(enteredAmount) > 0
                          ? validation?.valid 
                            ? "bg-primary/5 border-primary/30"
                            : "bg-destructive/5 border-destructive/30"
                          : "bg-muted/50 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{guarantor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Max can guarantee: KES {guarantor.totalInvested.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">KES</span>
                        <Input
                          type="number"
                          placeholder="Amount agreed"
                          value={enteredAmount}
                          onChange={(e) => handleGuarantorAmountChange(guarantor.id, e.target.value)}
                          className="flex-1"
                          max={guarantor.totalInvested}
                        />
                      </div>
                      {validation && !validation.valid && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {validation.message}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isGuaranteeValid && requiredGuarantee > 0 && totalGuaranteeEntered > 0 && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Need KES {(requiredGuarantee - totalGuaranteeEntered).toLocaleString()} more in guarantees
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="gold"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Request
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoanRequestModal;
