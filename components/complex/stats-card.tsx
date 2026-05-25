"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string | number
  change?: {
    value: number
    direction: "up" | "down"
  }
  trend?: "positive" | "negative" | "neutral"
  className?: string
}

export function StatsCard({
  icon,
  label,
  value,
  change,
  trend = "neutral",
  className,
}: StatsCardProps) {
  const trendColor = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-muted-foreground",
  }

  return (
    <div
      className={cn("space-y-2 rounded-lg border border-border p-4", className)}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-semibold">{value}</p>
        {change && (
          <p className={cn("text-xs font-medium", trendColor[trend])}>
            {change.direction === "up" ? "↑" : "↓"} {change.value}% from last
            month
          </p>
        )}
      </div>
    </div>
  )
}
