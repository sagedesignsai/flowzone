"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ActivityItem {
  id: string
  icon: ReactNode
  title: string
  description?: string
  timestamp: Date
  type: "success" | "info" | "warning" | "error"
}

interface ActivityFeedProps {
  items: ActivityItem[]
  maxItems?: number
}

export function ActivityFeed({ items, maxItems = 10 }: ActivityFeedProps) {
  const displayItems = items.slice(0, maxItems)

  const getTypeColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 text-green-600"
      case "error":
        return "bg-red-500/10 text-red-600"
      case "warning":
        return "bg-yellow-500/10 text-yellow-600"
      default:
        return "bg-blue-500/10 text-blue-600"
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-3">
      {displayItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">No activity yet</p>
        </div>
      ) : (
        displayItems.map((item, index) => (
          <div key={item.id} className="flex gap-3">
            {/* Timeline line */}
            {index < displayItems.length - 1 && (
              <div className="absolute top-[40px] left-[15px] h-[calc(100%-20px)] w-px bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                "relative mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                getTypeColor(item.type)
              )}
            >
              {item.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {formatTime(item.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
