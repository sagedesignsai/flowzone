"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession } from "@/lib/auth-client"
import { useState } from "react"

// ─── Component ──────────────────────────────────────────────────────────────

export function ProfileForm() {
  const { data: session, isPending } = useSession()
  const user = session?.user

  const [name, setName] = useState(user?.name ?? "")
  const [avatarUrl, setAvatarUrl] = useState(user?.image ?? "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  // Sync form when session loads (handles race with Zustand hydration)
  // We intentionally keep local state for the form so editing doesn't
  // mutate the session store until the user explicitly saves.

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: avatarUrl || null }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? "Failed to update profile")
      }

      setMessage({ type: "success", text: "Profile updated successfully." })
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user?.email ?? ""}
          disabled
          placeholder="you@example.com"
        />
        <p className="text-[11px] text-muted-foreground">
          Email cannot be changed.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar">Avatar URL</Label>
        <Input
          id="avatar"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://avatars.githubusercontent.com/..."
        />
      </div>

      {message && (
        <p
          className={
            message.type === "success"
              ? "text-xs text-emerald-600"
              : "text-xs text-destructive"
          }
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={saving} size="sm">
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  )
}
