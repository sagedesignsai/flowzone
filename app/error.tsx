"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Root error:", error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-lg text-destructive">!</span>
      </div>
      <div className="space-y-1 text-center">
        <h1 className="text-sm font-semibold">Something went wrong</h1>
        <p className="max-w-xs text-xs text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
