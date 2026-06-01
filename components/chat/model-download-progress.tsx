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
      <div className="mt-2 space-y-1.5 px-3 pb-2">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {message ?? "Model failed to load."}
        </div>
      </div>
    )
  }

  if (status === "complete") {
    return null
  }

  return (
    <div className="mt-2 space-y-1.5 px-3 pb-2">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{message ?? "Downloading model…"}</span>
        {status === "downloading" && <span>{progress}%</span>}
      </div>
      {status === "downloading" && (
        <Progress value={progress} className="h-1" />
      )}
    </div>
  )
}
