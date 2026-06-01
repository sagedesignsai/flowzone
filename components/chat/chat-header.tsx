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
    <div className="flex items-start justify-between gap-4 border-b border-border/60 px-4 py-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Chat
          </span>
            {projectId && <StatusPill label="Project context" />}
            {useLocalInference && <StatusPill label="Local AI" tone="muted" />}
            <StatusPill label={desktopLabel.label} tone={desktopLabel.tone} />
        </div>
        <p className="max-w-xl text-xs text-muted-foreground">
          Describe the change, inspect tool output, and keep moving with a minimal, focused thread.
        </p>
      </div>

      <StatusPill
        active={useWebSearch}
        label={capabilityLabel}
        tone={useWebSearch ? "success" : "default"}
      />
    </div>
  )
}
