import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Banknote,
  PiggyBank,
  AlertTriangle
} from "lucide-react";

interface FinancialOverviewProps {
  totalInvestments: number;
  totalLoansGiven: number;
  totalExpectedAfterLoans: number;
  availableBalance: number;
  minimumBalance: number;
  interestRate: number;
}

const FinancialOverview = ({
  totalInvestments,
  totalLoansGiven,
  totalExpectedAfterLoans,
  availableBalance,
  minimumBalance,
  interestRate,
}: FinancialOverviewProps) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `KES ${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `KES ${(amount / 1000).toFixed(0)}K`;
    }
    return `KES ${amount.toLocaleString()}`;
  };

  const balancePercentage = (availableBalance / totalInvestments) * 100;
  const isLowBalance = availableBalance < minimumBalance * 1.5;

  return (
    <Card variant="gold" className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-accent" />
          Group Financial Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Investments */}
          <div className="p-4 rounded-xl bg-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Total Investments</p>
            <p className="font-display text-xl font-bold">{formatCurrency(totalInvestments)}</p>
          </div>

          {/* Total Loans Given */}
          <div className="p-4 rounded-xl bg-warning/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-warning/20">
                <CreditCard className="w-4 h-4 text-warning" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Total Loans Given</p>
            <p className="font-display text-xl font-bold">{formatCurrency(totalLoansGiven)}</p>
            <p className="text-xs text-muted-foreground mt-1">@ {interestRate}%/month</p>
          </div>

          {/* Expected After Repayment */}
          <div className="p-4 rounded-xl bg-success/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-success/20">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Expected (with Interest)</p>
            <p className="font-display text-xl font-bold text-success">{formatCurrency(totalExpectedAfterLoans)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              +{formatCurrency(totalExpectedAfterLoans - totalInvestments)} gains
            </p>
          </div>

          {/* Available at Bank */}
          <div className={`p-4 rounded-xl ${isLowBalance ? "bg-destructive/10" : "bg-accent/10"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${isLowBalance ? "bg-destructive/20" : "bg-accent/20"}`}>
                {isLowBalance ? (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                ) : (
                  <Banknote className="w-4 h-4 text-accent" />
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Available at Bank</p>
            <p className={`font-display text-xl font-bold ${isLowBalance ? "text-destructive" : ""}`}>
              {formatCurrency(availableBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Min: {formatCurrency(minimumBalance)}
            </p>
          </div>
        </div>

        {/* Balance Bar */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Bank Balance Utilization</span>
            <span className="font-medium">{balancePercentage.toFixed(1)}% available</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isLowBalance ? "bg-destructive" : "bg-gradient-to-r from-accent to-accent/70"
              }`}
              style={{ width: `${Math.min(balancePercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>Loans: {formatCurrency(totalLoansGiven)}</span>
            <span>Available: {formatCurrency(availableBalance)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialOverview;
