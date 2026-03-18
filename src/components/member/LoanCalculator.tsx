import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

const LoanCalculator = () => {
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("1");

  const principal = parseFloat(amount) || 0;
  const numMonths = parseInt(months) || 1;
  const monthlyInterest = principal * 0.05;
  const totalInterest = monthlyInterest * numMonths;
  const totalRepayment = principal + totalInterest;
  const monthlyPayment = numMonths > 0 ? totalRepayment / numMonths : 0;

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-accent" />
          Loan Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Loan Amount (KES)</Label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Repayment Period (months)</Label>
          <Input
            type="number"
            min="1"
            max="24"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </div>
        {principal > 0 && (
          <div className="p-4 rounded-xl bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Interest (5%)</span>
              <span className="font-medium">KES {monthlyInterest.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Interest ({numMonths} mo)</span>
              <span className="font-medium text-warning">KES {totalInterest.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Payment</span>
              <span className="font-medium">KES {monthlyPayment.toLocaleString()}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-semibold">
              <span>Total Repayment</span>
              <span className="text-primary">KES {totalRepayment.toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanCalculator;
