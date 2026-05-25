"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useIdeStore } from "@/hooks/use-ide-store"
import {
  ArrowUpRight,
  CheckCircle,
  GitBranch,
  Spinner,
  WarningCircle,
} from "@phosphor-icons/react"
import { type FormEvent, useState } from "react"

// ─── Props ──────────────────────────────────────────────────────────────────

interface BranchDialogProps {
  chatId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BranchDialog({
  chatId,
  open,
  onOpenChange,
}: BranchDialogProps) {
  const { gitBranch, gitRepoOwner, gitRepoName, gitRepoFullName } =
    useIdeStore()

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    type: "success" | "error"
    message: string
    prUrl?: string
  } | null>(null)

  const hasRepo = gitRepoOwner && gitRepoName && gitBranch

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/github/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          title: title.trim(),
          body: body.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({
          type: "error",
          message: data.error ?? "Failed to create PR",
        })
        return
      }

      setResult({
        type: "success",
        message: `PR #${data.prNumber} created!`,
        prUrl: data.prUrl,
      })
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create PR",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Reset form when closing
      setTitle("")
      setBody("")
      setResult(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="size-4" />
            Create Pull Request
          </DialogTitle>
          <DialogDescription>
            Open a pull request from the current branch back to the base branch.
          </DialogDescription>
        </DialogHeader>

        {/* ── Repo info ───────────────────────────────── */}
        <div className="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {gitRepoFullName ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium">Repository:</span>
                <span>{gitRepoFullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Branch:</span>
                <code className="rounded bg-muted px-1 font-mono text-[11px]">
                  {gitBranch}
                </code>
              </div>
            </>
          ) : (
            <span className="italic">
              No Git repository linked. Start a desktop session and clone a repo
              first.
            </span>
          )}
        </div>

        {/* ── Form ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pr-title">Title</Label>
            <Input
              id="pr-title"
              placeholder="Summary of changes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!hasRepo || submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pr-body">Description (optional)</Label>
            <Textarea
              id="pr-body"
              placeholder="Detailed description of the changes..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={!hasRepo || submitting}
              rows={4}
            />
          </div>

          {/* ── Result feedback ────────────────────────── */}
          {result && (
            <Alert
              variant={result.type === "error" ? "destructive" : "default"}
            >
              {result.type === "error" ? (
                <WarningCircle className="size-4" />
              ) : (
                <CheckCircle className="size-4" />
              )}
              <AlertDescription className="flex items-center gap-2">
                {result.message}
                {result.prUrl && (
                  <a
                    href={result.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Open <ArrowUpRight className="size-3" />
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasRepo || !title.trim() || submitting}
            >
              {submitting ? (
                <>
                  <Spinner className="mr-1 size-3 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Pull Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
