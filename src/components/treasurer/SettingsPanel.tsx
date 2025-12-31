import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Percent,
  Target,
  Save,
  Settings,
  History,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  interestRate: number;
  investmentTarget: number;
  onUpdateInterestRate: (rate: number) => void;
  onUpdateTarget: (target: number) => void;
}

const SettingsPanel = ({
  interestRate,
  investmentTarget,
  onUpdateInterestRate,
  onUpdateTarget,
}: SettingsPanelProps) => {
  const { toast } = useToast();
  const [newInterestRate, setNewInterestRate] = useState(interestRate.toString());
  const [newTarget, setNewTarget] = useState(investmentTarget.toString());
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  const recentUpdates = [
    { id: 1, type: "Interest Rate", from: "4.5%", to: "5%", date: "Dec 15, 2024", by: "Mary Wanjiku" },
    { id: 2, type: "Target", from: "KES 4M", to: "KES 5M", date: "Nov 1, 2024", by: "Mary Wanjiku" },
    { id: 3, type: "Interest Rate", from: "4%", to: "4.5%", date: "Oct 21, 2024", by: "Mary Wanjiku" },
  ];

  const handleSaveInterestRate = async () => {
    const rate = parseFloat(newInterestRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "Invalid Interest Rate",
        description: "Please enter a valid percentage between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    setIsSavingRate(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onUpdateInterestRate(rate);
    toast({
      title: "Interest Rate Updated",
      description: `New interest rate set to ${rate}%`,
    });
    setIsSavingRate(false);
  };

  const handleSaveTarget = async () => {
    const target = parseFloat(newTarget);
    if (isNaN(target) || target <= 0) {
      toast({
        title: "Invalid Target",
        description: "Please enter a valid target amount",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTarget(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onUpdateTarget(target);
    toast({
      title: "Investment Target Updated",
      description: `New target set to KES ${target.toLocaleString()}`,
    });
    setIsSavingTarget(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">Loan & Investment Settings</h2>
          <p className="text-muted-foreground">Configure interest rates and investment targets</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Interest Rate Card */}
        <Card variant="gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-accent" />
              Interest Rate
            </CardTitle>
            <CardDescription>
              Set the interest rate applied to all new loans
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Current Rate</p>
              <p className="font-display text-3xl font-bold text-accent">{interestRate}%</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newRate">New Interest Rate (%)</Label>
              <div className="flex gap-2">
                <Input
                  id="newRate"
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={newInterestRate}
                  onChange={(e) => setNewInterestRate(e.target.value)}
                  placeholder="Enter new rate"
                />
                <Button
                  variant="default"
                  onClick={handleSaveInterestRate}
                  disabled={isSavingRate || newInterestRate === interestRate.toString()}
                >
                  {isSavingRate ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Rate applies to new loans only. Existing loans keep their original rate.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Investment Target Card */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Investment Target
            </CardTitle>
            <CardDescription>
              Set the group's collective investment goal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Current Target</p>
              <p className="font-display text-3xl font-bold">
                KES {investmentTarget.toLocaleString()}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newTarget">New Target Amount (KES)</Label>
              <div className="flex gap-2">
                <Input
                  id="newTarget"
                  type="number"
                  step="100000"
                  min="0"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="Enter new target"
                />
                <Button
                  variant="default"
                  onClick={handleSaveTarget}
                  disabled={isSavingTarget || newTarget === investmentTarget.toString()}
                >
                  {isSavingTarget ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Rules Summary */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Loan Eligibility Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground mb-1">Maximum Loan Amount</p>
              <p className="font-display text-xl font-bold">5x Contribution</p>
              <p className="text-sm text-muted-foreground mt-2">
                Members can borrow up to 5 times their total contributions
              </p>
            </div>
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
              <p className="text-sm text-muted-foreground mb-1">Guarantee Required</p>
              <p className="font-display text-xl font-bold text-accent">80% Coverage</p>
              <p className="text-sm text-muted-foreground mt-2">
                Loans must be guaranteed by 80% of the loan value
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Setting Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUpdates.map((update) => (
              <div
                key={update.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{update.type}</Badge>
                  <span className="text-sm">
                    <span className="text-muted-foreground">{update.from}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{update.to}</span>
                  </span>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{update.date}</p>
                  <p className="text-xs">by {update.by}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
