import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Percent, Target, Save, Settings, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useAppData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

const SettingsPanel = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();

  const interestRate = settings?.interest_rate ? Number(settings.interest_rate) : 5;
  const investmentTarget = settings?.investment_target ? Number(settings.investment_target) : 5000000;

  const [newInterestRate, setNewInterestRate] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  const handleSaveInterestRate = async () => {
    const rate = parseFloat(newInterestRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({ title: "Invalid Rate", description: "Enter a value between 0 and 100.", variant: "destructive" });
      return;
    }
    setIsSavingRate(true);
    try {
      await supabase.from("settings").update({ interest_rate: rate, updated_by: user!.id }).eq("id", settings!.id);
      await supabase.from("audit_logs").insert({
        action: "Interest Rate Updated", table_name: "settings",
        performed_by: user!.id, old_data: { interest_rate: interestRate }, new_data: { interest_rate: rate },
      });
      toast({ title: "Interest Rate Updated", description: `Set to ${rate}%.` });
      setNewInterestRate("");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsSavingRate(false);
  };

  const handleSaveTarget = async () => {
    const target = parseFloat(newTarget);
    if (isNaN(target) || target <= 0) {
      toast({ title: "Invalid Target", variant: "destructive" });
      return;
    }
    setIsSavingTarget(true);
    try {
      await supabase.from("settings").update({ investment_target: target, updated_by: user!.id }).eq("id", settings!.id);
      await supabase.from("audit_logs").insert({
        action: "Investment Target Updated", table_name: "settings",
        performed_by: user!.id, old_data: { investment_target: investmentTarget }, new_data: { investment_target: target },
      });
      toast({ title: "Target Updated", description: `Set to KES ${target.toLocaleString()}.` });
      setNewTarget("");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsSavingTarget(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10"><Settings className="w-6 h-6 text-primary" /></div>
        <div>
          <h2 className="font-display text-2xl font-semibold">Loan & Investment Settings</h2>
          <p className="text-muted-foreground">Configure interest rates and investment targets</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5 text-accent" /> Interest Rate</CardTitle>
            <CardDescription>Applied to all new loans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Current Rate</p>
              <p className="font-display text-3xl font-bold text-accent">{interestRate}%</p>
            </div>
            <div className="space-y-2">
              <Label>New Rate (%)</Label>
              <div className="flex gap-2">
                <Input type="number" step="0.5" min="0" max="100" value={newInterestRate} onChange={(e) => setNewInterestRate(e.target.value)} placeholder="Enter new rate" />
                <Button onClick={handleSaveInterestRate} disabled={isSavingRate || !newInterestRate}>
                  {isSavingRate ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Applies to new loans only.</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Investment Target</CardTitle>
            <CardDescription>Group's collective goal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Current Target</p>
              <p className="font-display text-3xl font-bold">KES {investmentTarget.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label>New Target (KES)</Label>
              <div className="flex gap-2">
                <Input type="number" step="100000" min="0" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="Enter new target" />
                <Button onClick={handleSaveTarget} disabled={isSavingTarget || !newTarget}>
                  {isSavingTarget ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="elevated">
        <CardHeader><CardTitle>Loan Eligibility Rules</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground mb-1">Maximum Loan Amount</p>
              <p className="font-display text-xl font-bold">5x Contribution</p>
              <p className="text-sm text-muted-foreground mt-2">Members can borrow up to 5 times their total contributions</p>
            </div>
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
              <p className="text-sm text-muted-foreground mb-1">Guarantee Required</p>
              <p className="font-display text-xl font-bold text-accent">80% Coverage</p>
              <p className="text-sm text-muted-foreground mt-2">Loans must be guaranteed by 80% of the loan value</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
