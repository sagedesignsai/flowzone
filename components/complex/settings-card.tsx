"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SettingsCardProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  toggle?: {
    enabled: boolean
    onChange: (enabled: boolean) => void
  }
  onClick?: () => void
  className?: string
}

export function SettingsCard({
  icon,
  title,
  description,
  action,
  toggle,
  onClick,
  className,
}: SettingsCardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3 flex-1">
        {icon && <div className="mt-0.5 flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        {toggle && (
          <Switch
            checked={toggle.enabled}
            onCheckedChange={toggle.onChange}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
      </div>
    </div>
  )
}
