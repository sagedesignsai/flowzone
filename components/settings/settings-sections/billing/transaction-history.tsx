"use client"

import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  Lightning,
  Timer,
  XCircle,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/stores/credits-store"
import { formatDate } from "./helpers"

function TransactionSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <CreditCard className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No transactions yet.</p>
      <p className="text-xs text-muted-foreground/70">
        Purchase credits above to get started.
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "completed") {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-400" variant="outline">
        <CheckCircle className="mr-0.5 size-2.5" />
        Done
      </Badge>
    )
  }
  if (status === "pending") {
    return (
      <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-400" variant="outline">
        <Timer className="mr-0.5 size-2.5" />
        Pending
      </Badge>
    )
  }
  if (status === "failed") {
    return (
      <Badge className="border-red-500/20 bg-red-500/10 text-[10px] text-red-400" variant="outline">
        <XCircle className="mr-0.5 size-2.5" />
        Failed
      </Badge>
    )
  }
  return <span className="text-[10px] text-muted-foreground">—</span>
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  totalTx: number
  loading: boolean
  error: string | null
}

export function TransactionHistory({
  transactions,
  totalTx,
  loading,
  error,
}: TransactionHistoryProps) {
  return (
    <>
      {loading ? (
        <TransactionSkeleton />
      ) : error ? (
        <p className="py-4 text-center text-sm text-destructive">{error}</p>
      ) : transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      tx.type === "purchase" && "text-emerald-400",
                      tx.type === "usage" && "text-amber-400",
                      tx.type === "refund" && "text-blue-400",
                      tx.type === "bonus" && "text-purple-400",
                    )}
                  >
                    {tx.type === "purchase" && <ArrowRight className="size-3" />}
                    {tx.type === "usage" && <Lightning className="size-3" />}
                    {tx.type === "refund" && <CheckCircle className="size-3" />}
                    {tx.type === "bonus" && <Lightning className="size-3" />}
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "tabular-nums text-sm font-medium",
                      tx.amount > 0 ? "text-emerald-400" : "text-amber-400",
                    )}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums text-sm text-muted-foreground">
                  {tx.balanceAfter.toLocaleString()}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {tx.description ?? "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={tx.status} />
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {formatDate(tx.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {totalTx > 50 && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Showing 50 of {totalTx} transactions.
        </p>
      )}
    </>
  )
}
