"use client"

import { cn } from "@/lib/utils"

export function StatusPill({
  label,
  active = false,
  tone = "default",
}: {
  label: string
  active?: boolean
  tone?: "default" | "success" | "warning" | "muted"
}) {
  const toneClasses = {
    default: "border-border/70 bg-muted/40 text-muted-foreground",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    muted: "border-border/70 bg-background text-muted-foreground",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] leading-none tracking-wide",
        active && "shadow-sm",
        toneClasses[tone],
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", active ? "bg-current" : "bg-current/50")}
      />
      {label}
    </span>
  )
}

export interface ChatHeaderProps {
  projectId?: string
  desktopLabel: { label: string; tone: "default" | "success" | "warning" | "muted" }
  capabilityLabel: string
  useWebSearch: boolean
  useLocalInference?: boolean
}

export function ChatHeader({
  projectId,
  desktopLabel,
  capabilityLabel,
  useWebSearch,
  useLocalInference,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {projectId && <StatusPill label="Project" />}
        {useLocalInference && <StatusPill label="Local" tone="muted" />}
        <StatusPill label={desktopLabel.label} tone={desktopLabel.tone} />
      </div>

      {useWebSearch && (
        <StatusPill
          active
          label="Web"
          tone="success"
        />
      )}
    </div>
  )
}
