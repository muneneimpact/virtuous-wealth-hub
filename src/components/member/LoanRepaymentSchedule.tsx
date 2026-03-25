import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyLoans, useMyTransactions } from "@/hooks/useAppData";
import { useSettings } from "@/hooks/useAppData";
import { Calendar, CheckCircle2, Clock, CreditCard } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const LoanRepaymentSchedule = () => {
  const { data: loans = [] } = useMyLoans();
  const { data: transactions = [] } = useMyTransactions();
  const { data: settings } = useSettings();

  const activeLoans = loans.filter(
    (l) => l.status === "disbursed" || l.status === "approved"
  );

  if (activeLoans.length === 0) return null;

  return (
    <div className="space-y-6">
      {activeLoans.map((loan) => {
        const principal = Number(loan.amount);
        const interestRate = Number(loan.interest_rate || settings?.interest_rate || 5) / 100;
        const months = Number(loan.repayment_months) || 1;
        const totalCost = Number(loan.total_cost) || principal * (1 + interestRate * months);
        const monthlyPayment = Number(loan.monthly_payment) || totalCost / months;
        const repaidAmount = Number(loan.repaid_amount) || 0;
        const remainingBalance = Math.max(0, totalCost - repaidAmount);

        // Get repayment transactions for this loan
        const loanRepayments = transactions
          .filter((t) => t.reference_id === loan.id && t.type === "loan_repayment")
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Build schedule
        const disbursementDate = new Date(loan.disbursement_date || loan.created_at);
        const schedule: Array<{
          month: number;
          dueDate: string;
          amountDue: number;
          amountPaid: number;
          balance: number;
          status: "paid" | "partial" | "upcoming" | "overdue";
        }> = [];

        let runningPaid = 0;
        let repaymentIndex = 0;

        for (let i = 1; i <= months; i++) {
          const dueDate = new Date(disbursementDate);
          dueDate.setMonth(dueDate.getMonth() + i);

          const isLastMonth = i === months;
          const amountDue = isLastMonth
            ? Math.max(0, totalCost - monthlyPayment * (months - 1))
            : monthlyPayment;

          // Sum payments made in this period
          let paidThisMonth = 0;
          while (repaymentIndex < loanRepayments.length) {
            const payDate = new Date(loanRepayments[repaymentIndex].created_at);
            const nextDue = new Date(disbursementDate);
            nextDue.setMonth(nextDue.getMonth() + i + 1);

            if (payDate <= nextDue) {
              paidThisMonth += Number(loanRepayments[repaymentIndex].amount);
              repaymentIndex++;
            } else {
              break;
            }
          }

          // Handle overpayment carrying forward
          runningPaid += paidThisMonth;
          const expectedByNow = amountDue * i;
          const balanceAfter = Math.max(0, totalCost - runningPaid);

          const now = new Date();
          let status: "paid" | "partial" | "upcoming" | "overdue";
          if (runningPaid >= amountDue * i) {
            status = "paid";
          } else if (dueDate < now && runningPaid < amountDue * i) {
            status = paidThisMonth > 0 ? "partial" : "overdue";
          } else {
            status = "upcoming";
          }

          schedule.push({
            month: i,
            dueDate: dueDate.toLocaleDateString("en-KE", { month: "short", year: "numeric" }),
            amountDue,
            amountPaid: paidThisMonth,
            balance: balanceAfter,
            status,
          });
        }

        // Handle extra payments beyond schedule
        while (repaymentIndex < loanRepayments.length) {
          runningPaid += Number(loanRepayments[repaymentIndex].amount);
          repaymentIndex++;
        }

        const progressPercent = totalCost > 0 ? Math.min(100, (repaidAmount / totalCost) * 100) : 0;

        return (
          <Card key={loan.id} variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-warning" />
                Loan Repayment Schedule
              </CardTitle>
              <div className="flex flex-wrap gap-3 text-sm mt-2">
                <Badge variant="secondary">
                  Principal: KES {principal.toLocaleString()}
                </Badge>
                <Badge variant="secondary">
                  Total Due: KES {totalCost.toLocaleString()}
                </Badge>
                <Badge variant={remainingBalance <= 0 ? "default" : "destructive"}>
                  Balance: KES {remainingBalance.toLocaleString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Repayment Progress</span>
                  <span className="font-semibold">{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success to-success/70 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Paid: KES {repaidAmount.toLocaleString()}</span>
                  <span>Remaining: KES {remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Schedule table */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Month</TableHead>
                      <TableHead className="text-xs">Due Date</TableHead>
                      <TableHead className="text-xs text-right">Due</TableHead>
                      <TableHead className="text-xs text-right">Paid</TableHead>
                      <TableHead className="text-xs text-right">Balance</TableHead>
                      <TableHead className="text-xs text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell className="text-sm font-medium">{row.month}</TableCell>
                        <TableCell className="text-sm">{row.dueDate}</TableCell>
                        <TableCell className="text-sm text-right">
                          KES {row.amountDue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {row.amountPaid > 0 ? (
                            <span className="text-success">KES {row.amountPaid.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          KES {row.balance.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.status === "paid" && (
                            <Badge variant="default" className="text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </Badge>
                          )}
                          {row.status === "partial" && (
                            <Badge variant="secondary" className="text-xs">Partial</Badge>
                          )}
                          {row.status === "upcoming" && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Clock className="w-3 h-3" /> Upcoming
                            </Badge>
                          )}
                          {row.status === "overdue" && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Monthly payment: KES {monthlyPayment.toLocaleString()} at {(interestRate * 100).toFixed(0)}% interest/month
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LoanRepaymentSchedule;
