import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";

export type TransactionRowData = {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  date: Date | string;
  accountName: string;
  categoryName?: string | null;
  categoryColor?: string | null;
};

export function TransactionRow({ tx }: { tx: TransactionRowData }) {
  const isIncome = tx.type === "INCOME";

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          isIncome ? "bg-income/10 text-income" : "bg-expense/10 text-expense",
        )}
      >
        {isIncome ? (
          <ArrowDownLeft className="size-4" strokeWidth={1.75} />
        ) : (
          <ArrowUpRight className="size-4" strokeWidth={1.75} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{tx.description}</span>
        <span className="truncate text-xs text-muted-foreground">
          {tx.accountName}
          {tx.categoryName ? ` · ${tx.categoryName}` : ""} · {formatDate(tx.date)}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-medium tabular-nums",
          isIncome ? "text-income" : "text-expense",
        )}
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(tx.amount)}
      </span>
    </div>
  );
}
