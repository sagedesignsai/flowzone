"use client"

import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "error" | "warning"
  label: string
  size?: "sm" | "md"
}

export function StatusBadge({ status, label, size = "md" }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      bg: "bg-green-500/10",
      text: "text-green-600",
      dot: "bg-green-500",
    },
    inactive: {
      bg: "bg-gray-500/10",
      text: "text-gray-600",
      dot: "bg-gray-500",
    },
    pending: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-600",
      dot: "bg-yellow-500",
    },
    error: {
      bg: "bg-red-500/10",
      text: "text-red-600",
      dot: "bg-red-500",
    },
    warning: {
      bg: "bg-orange-500/10",
      text: "text-orange-600",
      dot: "bg-orange-500",
    },
  }

  const config = statusConfig[status]
  const sizeClass =
    size === "sm" ? "text-xs px-2 py-1" : "text-xs px-2.5 py-1.5"

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full",
        config.bg,
        config.text,
        sizeClass
      )}
    >
      <div className={cn("size-1.5 rounded-full", config.dot)} />
      <span className="font-medium">{label}</span>
    </div>
  )
}
