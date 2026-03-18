import { useState } from "react";
import { Download, Filter, Calendar, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyTransactions } from "@/hooks/useAppData";
import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: any;
  }
}

const TransactionHistory = () => {
  const { data: transactions = [] } = useMyTransactions();
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    const amountA = Number(a.amount);
    const amountB = Number(b.amount);

    switch (sortBy) {
      case "date-desc":
        return dateB - dateA;
      case "date-asc":
        return dateA - dateB;
      case "amount-desc":
        return amountB - amountA;
      case "amount-asc":
        return amountA - amountB;
      default:
        return dateB - dateA;
    }
  });

  const totalCredit = filteredTransactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalDebit = filteredTransactions
    .filter((t) => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "contribution":
        return "bg-success/10 text-success";
      case "loan_disbursement":
        return "bg-warning/10 text-warning";
      case "loan_repayment":
        return "bg-primary/10 text-primary";
      case "interest_accrual":
        return "bg-accent/10 text-accent";
      default:
        return "bg-muted/10";
    }
  };

  const getTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const now = new Date();

    // Header
    doc.setFontSize(18);
    doc.text("Transaction History Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${now.toLocaleDateString("en-KE")} at ${now.toLocaleTimeString("en-KE")}`, 14, 32);

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Summary", 14, 45);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text([
      `Total Transactions: ${filteredTransactions.length}`,
      `Total Credits: KES ${totalCredit.toLocaleString()}`,
      `Total Debits: KES ${totalDebit.toLocaleString()}`,
      `Net: KES ${(totalCredit - totalDebit).toLocaleString()}`,
    ], 14, 52);

    // Table
    const tableData = sortedTransactions.map((t) => [
      new Date(t.created_at).toLocaleDateString("en-KE"),
      getTypeLabel(t.type),
      t.description || "-",
      `KES ${Math.abs(Number(t.amount)).toLocaleString()}`,
      Number(t.amount) > 0 ? "Credit" : "Debit",
    ]);

    doc.autoTable({
      head: [["Date", "Type", "Description", "Amount", "Direction"]],
      body: tableData,
      startY: 75,
      theme: "grid",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 25 },
        1: { halign: "center", cellWidth: 30 },
        2: { halign: "left", cellWidth: 65 },
        3: { halign: "right", cellWidth: 28 },
        4: { halign: "center", cellWidth: 25 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data: any) => {
        // Footer
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.getHeight();
        const pageWidth = pageSize.getWidth();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${data.pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      },
    });

    doc.save(`transaction-history-${now.toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Transaction History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={downloadPDF} className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter by Type
              </Label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Transactions</option>
                <option value="contribution">Contributions</option>
                <option value="loan_disbursement">Loan Disbursements</option>
                <option value="loan_repayment">Loan Repayments</option>
                <option value="interest_accrual">Interest Accrual</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterType("all");
                  setSortBy("date-desc");
                }}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg bg-success/5 border border-success/20">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-success" /> Total Credits
              </p>
              <p className="font-display text-2xl font-bold text-success">
                KES {totalCredit.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredTransactions.filter((t) => Number(t.amount) > 0).length} transactions
              </p>
            </div>

            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-destructive" /> Total Debits
              </p>
              <p className="font-display text-2xl font-bold text-destructive">
                KES {totalDebit.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredTransactions.filter((t) => Number(t.amount) < 0).length} transactions
              </p>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-primary" /> Net
              </p>
              <p className={`font-display text-2xl font-bold ${totalCredit >= totalDebit ? "text-success" : "text-destructive"}`}>
                KES {(totalCredit - totalDebit).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredTransactions.length} total transactions
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold">Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString("en-KE")}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getTypeColor(transaction.type)} variant="secondary">
                          {getTypeLabel(transaction.type)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{transaction.description || "-"}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        KES {Math.abs(Number(transaction.amount)).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={Number(transaction.amount) > 0 ? "default" : "destructive"}
                        >
                          {Number(transaction.amount) > 0 ? "Credit" : "Debit"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
