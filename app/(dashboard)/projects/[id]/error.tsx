"use client"

import { Button } from "@/components/ui/button"

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
      <div className="space-y-1 text-center">
        <h2 className="text-sm font-semibold">Failed to load project</h2>
        <p className="text-xs text-muted-foreground">
          {error.message ?? "An unexpected error occurred."}
        </p>
      </div>
      <Button size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
