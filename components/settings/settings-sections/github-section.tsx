"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useSettingsStore,
  type GitHubInstallation,
  type GitHubRepository,
} from "@/stores/settings-store"
import { useSession, signIn } from "@/lib/auth-client"
import { GitBranch, ArrowUpRight, GithubLogo } from "@phosphor-icons/react"
import { useEffect, useState } from "react"

// ─── Component ─────────────────────────────────────────────────────────────

interface GitHubSectionProps {
  chatId?: string
}

export function GitHubSection({ chatId }: GitHubSectionProps) {
  const { data: session } = useSession()
  const github = useSettingsStore((s) => s.github)
  const hasOAuth = useSettingsStore((s) => s.hasOAuth)
  const installations = useSettingsStore((s) => s.installations)
  const repositories = useSettingsStore((s) => s.repositories)
  const setGithub = useSettingsStore((s) => s.setGithub)
  const setHasOAuth = useSettingsStore((s) => s.setHasOAuth)
  const setInstallations = useSettingsStore((s) => s.setInstallations)
  const setRepositories = useSettingsStore((s) => s.setRepositories)
  const setSaving = useSettingsStore((s) => s.setSaving)
  const setMessage = useSettingsStore((s) => s.setMessage)

  const [selectedInstallation, setSelectedInstallation] = useState("")
  const [selectedRepo, setSelectedRepo] = useState("")
  const [loading, setLoading] = useState(true)

  // ── Load GitHub config on mount ────────────────────────────

  useEffect(() => {
    if (!session?.user.id) return

    const loadGitHub = async () => {
      try {
        const params = new URLSearchParams()
        if (chatId) params.set("chatId", chatId)
        const res = await fetch(`/api/settings/github?${params}`)
        if (res.ok) {
          const data = await res.json()
          setHasOAuth(data.hasOAuth ?? false)
          setGithub(data.github)
          setInstallations(data.installations || [])

          if (data.installations?.length > 0 && !selectedInstallation) {
            setSelectedInstallation(String(data.installations[0].id))
          }
        }
      } catch (err) {
        console.error("Failed to load GitHub config:", err)
      } finally {
        setLoading(false)
      }
    }

    loadGitHub()
  }, [session?.user.id, chatId, setGithub, setHasOAuth, setInstallations])

  // ── Load repos when installation changes ───────────────────

  useEffect(() => {
    if (!selectedInstallation) return

    const loadRepos = async () => {
      try {
        const res = await fetch(
          `/api/github/repos?installationId=${selectedInstallation}`
        )
        if (res.ok) {
          const data = await res.json()
          setRepositories(data.repositories || [])
        }
      } catch (err) {
        console.error("Failed to load repositories:", err)
      }
    }

    loadRepos()
  }, [selectedInstallation, setRepositories])

  // ── Handlers ───────────────────────────────────────────────

  const handleConnect = async () => {
    if (!selectedRepo) {
      setMessage({ type: "error", text: "Please select a repository" })
      return
    }

    const repo = repositories.find((r) => r.fullName === selectedRepo)
    if (!repo) return

    setSaving(true)
    try {
      const res = await fetch("/api/settings/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          repoFullName: repo.fullName,
          installationId: repo.installationId,
          chatId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGithub(data.github)
        setMessage({
          type: "success",
          text: "GitHub repository connected to this project",
        })
      } else {
        throw new Error("Failed to connect repository")
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Failed to connect repository",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      })

      if (res.ok) {
        setGithub(null)
        setMessage({ type: "success", text: "GitHub repository disconnected" })
      } else {
        throw new Error("Failed to disconnect repository")
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to disconnect repository",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSignIn = () => {
    signIn.social({
      provider: "github",
      callbackURL: "/settings",
    })
  }

  // ── Loading ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // ── State 1: No GitHub OAuth connected ─────────────────────

  if (!hasOAuth) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">GitHub Account</h3>
          <p className="text-xs text-muted-foreground">
            Sign in with GitHub to enable repository integration and version
            control features.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <GithubLogo className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                GitHub Account Not Connected
              </p>
              <p className="text-xs text-muted-foreground">
                Connect your GitHub account to access repositories and create
                pull requests
              </p>
            </div>
            <Button size="sm" onClick={handleSignIn} className="gap-1.5">
              <GithubLogo className="size-3.5" />
              Connect GitHub Account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── State 2: Has OAuth, but no GitHub App installations ───

  if (installations.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">GitHub App</h3>
          <p className="text-xs text-muted-foreground">
            Install the Flowzone GitHub App to give it access to your
            repositories.
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <GitBranch className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">GitHub App Not Installed</p>
              <p className="text-xs text-muted-foreground">
                The Flowzone GitHub App needs to be installed on your GitHub
                account or organization
              </p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                window.open(
                  process.env.NEXT_PUBLIC_GITHUB_APP_URL ||
                    "https://github.com/apps/flowzone",
                  "_blank"
                )
              }
              className="gap-1.5"
            >
              <ArrowUpRight className="size-3.5" />
              Install GitHub App
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── State 3: Connected repository ──────────────────────────

  if (github?.connected) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Repository</h3>
          <p className="text-xs text-muted-foreground">
            Connected repository for this project.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                <GitBranch className="size-5 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {github.owner}/{github.name}
                  </p>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => window.open(github.url, "_blank")}
                  >
                    <ArrowUpRight className="size-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connected to this project
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── State 4: Has installations, select repository ──────────

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Repository</h3>
        <p className="text-xs text-muted-foreground">
          Select a repository to connect to this project.
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Repository will be connected to this project.
          </p>
        </div>

        {/* Installation selector (shown when multiple accounts) */}
        {installations.length > 1 && (
          <Select
            value={selectedInstallation}
            onValueChange={setSelectedInstallation}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Select a GitHub account" />
            </SelectTrigger>
            <SelectContent>
              {installations.map((inst) => (
                <SelectItem key={inst.id} value={String(inst.id)}>
                  <div className="flex items-center gap-2">
                    {inst.accountLogin} ({inst.reposCount} repos)
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedRepo} onValueChange={setSelectedRepo}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="Select a repository" />
          </SelectTrigger>
          <SelectContent>
            {repositories.map((repo) => (
              <SelectItem key={repo.id} value={repo.fullName}>
                <div className="flex items-center gap-2">
                  <GitBranch className="size-3.5" />
                  {repo.fullName}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleConnect}
          className="w-full"
          disabled={!selectedRepo}
        >
          Connect Repository
        </Button>
      </div>

      {repositories.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-xs text-muted-foreground">
            No repositories found. Make sure the GitHub App has access to your
            repositories.
          </p>
        </div>
      )}
    </div>
  )
}
