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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wallet, CreditCard, AlertTriangle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: number;
  name: string;
  email: string;
  totalInvested: number;
  arrears: number;
  loanBalance: number;
  status: string;
}

interface MemberUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onUpdate: (member: Member) => void;
}

const MemberUpdateModal = ({
  open,
  onOpenChange,
  member,
  onUpdate,
}: MemberUpdateModalProps) => {
  const { toast } = useToast();
  const [contributionAmount, setContributionAmount] = useState("");
  const [arrearsAmount, setArrearsAmount] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!member) return null;

  const handleAddContribution = async () => {
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid contribution amount",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const updated = {
      ...member,
      totalInvested: member.totalInvested + amount,
    };
    onUpdate(updated);
    
    toast({
      title: "Contribution Recorded",
      description: `KES ${amount.toLocaleString()} added to ${member.name}'s account`,
    });
    
    setContributionAmount("");
    setIsSaving(false);
  };

  const handleRecordArrears = async () => {
    const amount = parseFloat(arrearsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid arrears amount",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const updated = {
      ...member,
      arrears: member.arrears + amount,
      status: "arrears",
    };
    onUpdate(updated);
    
    toast({
      title: "Arrears Recorded",
      description: `KES ${amount.toLocaleString()} arrears added for ${member.name}`,
    });
    
    setArrearsAmount("");
    setIsSaving(false);
  };

  const handleClearArrears = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const updated = {
      ...member,
      arrears: 0,
      status: "active",
    };
    onUpdate(updated);
    
    toast({
      title: "Arrears Cleared",
      description: `All arrears cleared for ${member.name}`,
    });
    
    setIsSaving(false);
  };

  const handleRecordRepayment = async () => {
    const amount = parseFloat(repaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid repayment amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > member.loanBalance) {
      toast({
        title: "Amount Exceeds Balance",
        description: "Repayment cannot exceed loan balance",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const updated = {
      ...member,
      loanBalance: member.loanBalance - amount,
    };
    onUpdate(updated);
    
    toast({
      title: "Repayment Recorded",
      description: `KES ${amount.toLocaleString()} repayment recorded for ${member.name}`,
    });
    
    setRepaymentAmount("");
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Update Member Records</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Updating records for <span className="font-semibold">{member.name}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Member Summary */}
        <div className="p-4 rounded-xl bg-muted/50 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Invested</p>
              <p className="font-semibold text-primary">KES {member.totalInvested.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Arrears</p>
              <p className={`font-semibold ${member.arrears > 0 ? "text-destructive" : "text-success"}`}>
                {member.arrears > 0 ? `KES ${member.arrears.toLocaleString()}` : "None"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Loan Balance</p>
              <p className={`font-semibold ${member.loanBalance > 0 ? "text-warning" : "text-muted-foreground"}`}>
                {member.loanBalance > 0 ? `KES ${member.loanBalance.toLocaleString()}` : "None"}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="contribution" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contribution" className="text-xs">
              <Wallet className="w-3 h-3 mr-1" />
              Contribution
            </TabsTrigger>
            <TabsTrigger value="arrears" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Arrears
            </TabsTrigger>
            <TabsTrigger value="repayment" className="text-xs">
              <CreditCard className="w-3 h-3 mr-1" />
              Loan Repayment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contribution" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="contribution">Add Contribution (KES)</Label>
              <Input
                id="contribution"
                type="number"
                placeholder="Enter amount"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </div>
            <Button
              variant="gold"
              className="w-full"
              onClick={handleAddContribution}
              disabled={isSaving || !contributionAmount}
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Record Contribution
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="arrears" className="space-y-4 mt-4">
            {member.arrears > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Current Arrears: KES {member.arrears.toLocaleString()}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="arrears">Add Arrears Amount (KES)</Label>
              <Input
                id="arrears"
                type="number"
                placeholder="Enter arrears amount"
                value={arrearsAmount}
                onChange={(e) => setArrearsAmount(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRecordArrears}
                disabled={isSaving || !arrearsAmount}
              >
                Record Arrears
              </Button>
              {member.arrears > 0 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClearArrears}
                  disabled={isSaving}
                >
                  Clear All Arrears
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="repayment" className="space-y-4 mt-4">
            {member.loanBalance > 0 ? (
              <>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm font-medium text-warning flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Outstanding Loan: KES {member.loanBalance.toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="repayment">Repayment Amount (KES)</Label>
                  <Input
                    id="repayment"
                    type="number"
                    placeholder="Enter repayment amount"
                    value={repaymentAmount}
                    onChange={(e) => setRepaymentAmount(e.target.value)}
                    max={member.loanBalance}
                  />
                </div>
                
                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleRecordRepayment}
                  disabled={isSaving || !repaymentAmount}
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Record Repayment
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No active loan for this member</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberUpdateModal;
