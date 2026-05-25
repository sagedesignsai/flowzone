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
      <div className="flex flex-1 items-start gap-3">
        {icon && <div className="mt-0.5 flex-shrink-0">{icon}</div>}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="ml-4 flex flex-shrink-0 items-center gap-2">
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
