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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Calculator, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: number;
  name: string;
  totalInvested: number;
  loanBalance: number;
}

interface LoanProcessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  interestRate: number;
}

const LoanProcessingModal = ({
  open,
  onOpenChange,
  members,
  interestRate,
}: LoanProcessingModalProps) => {
  const { toast } = useToast();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedMember = members.find((m) => m.id.toString() === selectedMemberId);
  
  // Loan eligibility: Max 5x contribution
  const maxLoanAmount = selectedMember ? selectedMember.totalInvested * 5 : 0;
  
  // Required guarantee: 80% of loan amount
  const requiredGuarantee = parseFloat(loanAmount) * 0.8 || 0;
  
  // Calculate total guarantee available from selected guarantors
  const totalGuaranteeAvailable = useMemo(() => {
    return selectedGuarantors.reduce((sum, gId) => {
      const guarantor = members.find((m) => m.id.toString() === gId);
      return sum + (guarantor?.totalInvested || 0);
    }, 0);
  }, [selectedGuarantors, members]);

  const isGuaranteeValid = totalGuaranteeAvailable >= requiredGuarantee;
  const isAmountValid = parseFloat(loanAmount) > 0 && parseFloat(loanAmount) <= maxLoanAmount;
  const canProcess = selectedMember && isAmountValid && isGuaranteeValid && selectedGuarantors.length > 0;

  // Calculate interest and total repayment
  const interestAmount = parseFloat(loanAmount) * (interestRate / 100) || 0;
  const totalRepayment = parseFloat(loanAmount) + interestAmount || 0;

  const availableGuarantors = members.filter(
    (m) => m.id.toString() !== selectedMemberId
  );

  const handleGuarantorToggle = (guarantorId: string) => {
    setSelectedGuarantors((prev) =>
      prev.includes(guarantorId)
        ? prev.filter((id) => id !== guarantorId)
        : [...prev, guarantorId]
    );
  };

  const handleProcessLoan = async () => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: "Loan Processed Successfully",
      description: `KES ${parseFloat(loanAmount).toLocaleString()} disbursed to ${selectedMember?.name}`,
    });
    
    setIsProcessing(false);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMemberId("");
    setLoanAmount("");
    setSelectedGuarantors([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Process New Loan</DialogTitle>
          <DialogDescription>
            Loans are capped at 5x member contribution and require 80% guarantee coverage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label>Select Member</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{member.name}</span>
                      <span className="text-muted-foreground text-xs">
                        (Invested: KES {member.totalInvested.toLocaleString()})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loan Eligibility Info */}
          {selectedMember && (
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-accent" />
                <span className="font-semibold">Loan Eligibility</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Contribution</p>
                  <p className="font-semibold">KES {selectedMember.totalInvested.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Maximum Loan (5x)</p>
                  <p className="font-semibold text-accent">KES {maxLoanAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Loan Balance</p>
                  <p className="font-semibold">KES {selectedMember.loanBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold">{interestRate}%</p>
                </div>
              </div>
            </div>
          )}

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
              disabled={!selectedMember}
            />
            {loanAmount && !isAmountValid && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Amount exceeds maximum eligible (KES {maxLoanAmount.toLocaleString()})
              </p>
            )}
          </div>

          {/* Repayment Calculation */}
          {loanAmount && isAmountValid && (
            <div className="p-4 rounded-xl bg-muted/50 border">
              <p className="text-sm text-muted-foreground mb-2">Repayment Summary</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Principal</p>
                  <p className="font-semibold">KES {parseFloat(loanAmount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interest ({interestRate}%)</p>
                  <p className="font-semibold text-warning">KES {interestAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Repayment</p>
                  <p className="font-semibold text-primary">KES {totalRepayment.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Guarantor Selection */}
          {selectedMember && loanAmount && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Select Guarantors (80% coverage required)
                </Label>
                <Badge variant={isGuaranteeValid ? "default" : "destructive"}>
                  {isGuaranteeValid ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  KES {totalGuaranteeAvailable.toLocaleString()} / {requiredGuarantee.toLocaleString()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {availableGuarantors.map((guarantor) => {
                  const isSelected = selectedGuarantors.includes(guarantor.id.toString());
                  return (
                    <button
                      key={guarantor.id}
                      type="button"
                      onClick={() => handleGuarantorToggle(guarantor.id.toString())}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/50 border-transparent hover:border-muted-foreground/20"
                      }`}
                    >
                      <p className="font-medium text-sm">{guarantor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Can guarantee: KES {guarantor.totalInvested.toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>

              {!isGuaranteeValid && requiredGuarantee > 0 && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Need KES {(requiredGuarantee - totalGuaranteeAvailable).toLocaleString()} more in guarantees
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
            onClick={handleProcessLoan}
            disabled={!canProcess || isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              "Process Loan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoanProcessingModal;
