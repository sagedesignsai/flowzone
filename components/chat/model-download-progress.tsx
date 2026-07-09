"use client"

import { Progress } from "@/components/ui/progress"

interface ModelDownloadProgressProps {
  message?: string
  status: "downloading" | "complete" | "error" | string
  progress: number
}

/**
 * Inline progress indicator for model download.
 * Rendered as a custom data part inside assistant messages.
 */
export function ModelDownloadProgress({
  message,
  status,
  progress,
}: ModelDownloadProgressProps) {
  if (status === "error") {
    return (
      <div className="space-y-1 px-2 pb-1">
        <div className="rounded-md border border-destructive/15 bg-destructive/[0.03] px-2 py-1 text-[11px] text-destructive/80">
          {message ?? "Model failed to load."}
        </div>
      </div>
    )
  }

  if (status === "complete") {
    return null
  }

  return (
    <div className="space-y-1 px-2 pb-1">
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>{message ?? "Downloading model…"}</span>
        {status === "downloading" && <span>{progress}%</span>}
      </div>
      {status === "downloading" && (
        <Progress value={progress} className="h-0.5" />
      )}
    </div>
  )
}
