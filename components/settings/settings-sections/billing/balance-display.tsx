"use client"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function BalanceSkeleton() {
  return (
    <div className="flex items-baseline gap-2">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

export function BalanceDisplay({ balance }: { balance: number | null }) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {balance === null ? (
          <BalanceSkeleton />
        ) : (
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold tabular-nums tracking-tight">
              {balance.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">credits</span>
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Credits are consumed by AI agent interactions.{" "}
          {balance !== null && balance < 100
            ? "You're running low — top up below."
            : ""}
        </p>
      </div>

      {balance !== null && balance > 0 && (
        <Badge
          className={cn(
            "self-start px-3 py-1 text-xs",
            balance > 500
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : balance > 100
                ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-400",
          )}
          variant="outline"
        >
          {balance > 500 ? "Healthy" : balance > 100 ? "Adequate" : "Low"}
        </Badge>
      )}
    </div>
  )
}
