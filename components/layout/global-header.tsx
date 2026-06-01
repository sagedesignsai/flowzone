"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/settings/settings-dialog"
import { useIdeStore } from "@/hooks/use-ide-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useCreditsStore } from "@/stores/credits-store"
import { useSession, signOut } from "@/lib/auth-client"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  CaretDown,
  Gear,
  GitBranch,
  ShareNetwork,
  SignOut,
  User,
  ArrowUpRight,
  FileText,
  Users,
  ChatCircle,
  Gift,
  Trophy,
  Monitor,
  Sun,
  Moon,
} from "@phosphor-icons/react"
import type { ComponentProps } from "react"
import { useState, useEffect } from "react"
import { BranchDialog } from "@/components/layout/branch-dialog"

// ─── Props ───────────────────────────────────────────────────────────────────

interface GlobalHeaderProps extends ComponentProps<"header"> {
  breadcrumb?: string
  showActions?: boolean
  chatId?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GlobalHeader({
  breadcrumb,
  showActions = false,
  chatId,
  className,
  ...props
}: GlobalHeaderProps) {
  const { data: session } = useSession()
  const user = session?.user

  // ── Credits store ────────────────────────────────────────────
  const credits = useCreditsStore((s) => s.balance)
  const fetchBalance = useCreditsStore((s) => s.fetchBalance)

  useEffect(() => {
    if (user) fetchBalance()
  }, [user, fetchBalance])

  const chatDesktop = useIdeStore((s) =>
    chatId ? s.chatDesktops[chatId] : null,
  )
  const desktopSandboxId = chatDesktop?.sandboxId ?? null
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)

  // Read GitHub connection status from persisted store
  const ghConfig = useSettingsStore((s) => s.github)

  const handleSettings = () => {
    setSettingsOpen(true)
  }

  const handleShare = () => {
    // TODO: Open share dialog with link
    console.log("Share clicked")
  }

  const handleViewBranch = () => {
    setBranchDialogOpen(true)
  }
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?"

  return (
    <header
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 border-b border-border bg-background px-3 text-xs",
        className
      )}
      {...props}
    >
      {/* ── Left: sidebar trigger + breadcrumb ─────────────────── */}
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 size-6" />

        {breadcrumb && (
          <>
            <Separator className="h-4" orientation="vertical" />
            <span className="truncate text-muted-foreground">{breadcrumb}</span>
          </>
        )}
      </div>

      {/* ── Center: breadcrumb ──────────────────────────────────── */}
      {breadcrumb && (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-xs text-muted-foreground">{breadcrumb}</span>
        </div>
      )}

      {/* ── Right: actions + auth / user menu ──────────────────── */}
      <div className="ml-auto flex items-center gap-2">
        {/* Action buttons (Settings, Share, View Branch) */}
        {showActions && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleSettings}
            >
              <Gear className="size-3.5" />
              Settings
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleShare}
            >
              <ShareNetwork className="size-3.5" />
              Share
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleViewBranch}
            >
              <GitBranch className="size-3.5" />
              View Branch
            </Button>

            <Separator className="h-4" orientation="vertical" />
          </>
        )}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs",
                    "transition-colors hover:bg-muted"
                  )}
                  type="button"
                />
              }
            >
              <Avatar className="size-5">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[120px] truncate">{user.name}</span>
              <CaretDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* Email */}
              <div className="px-2 py-1.5">
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>

              <DropdownMenuSeparator />

              {/* Main menu items */}
              <DropdownMenuGroup>
                <DropdownMenuItem render={<Link href="/settings/profile" />}>
                  <User className="mr-2 size-3.5" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* GitHub integration */}
              <DropdownMenuGroup>
                {ghConfig?.connected ? (
                  <DropdownMenuItem
                    onClick={() => window.open(ghConfig.url, "_blank")}
                  >
                    <GitBranch className="mr-2 size-3.5 text-green-500" />
                    <span>
                      {ghConfig.owner}/{ghConfig.name}
                    </span>
                    <span className="ml-auto flex size-2 rounded-full bg-green-500" />
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem render={<Link href="/settings/github" />}>
                    <GitBranch className="mr-2 size-3.5" />
                    <span>Connect GitHub</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* External links */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://pricing.example.com", "_blank")
                  }
                >
                  <svg
                    className="mr-2 size-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Pricing</span>
                  <ArrowUpRight className="ml-auto size-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://docs.example.com", "_blank")
                  }
                >
                  <FileText className="mr-2 size-3.5" />
                  <span>Documentation</span>
                  <ArrowUpRight className="ml-auto size-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://community.example.com", "_blank")
                  }
                >
                  <Users className="mr-2 size-3.5" />
                  <span>Community Forum</span>
                  <ArrowUpRight className="ml-auto size-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://feedback.example.com", "_blank")
                  }
                >
                  <ChatCircle className="mr-2 size-3.5" />
                  <span>Feedback</span>
                  <ArrowUpRight className="ml-auto size-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://refer.example.com", "_blank")
                  }
                >
                  <Gift className="mr-2 size-3.5" />
                  <span>Refer</span>
                  <ArrowUpRight className="ml-auto size-3" />
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Credits */}
              <DropdownMenuItem render={<Link href="/settings/billing" />}>
                <Trophy className="mr-2 size-3.5 text-amber-500" />
                <span>Credits</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {credits !== null ? credits.toLocaleString() : "..."}
                </span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Preferences */}
              <div className="px-2 py-2">
                <p className="mb-2 text-xs font-medium">Preferences</p>
                <div className="space-y-2">
                  <p className="mb-1.5 text-xs text-muted-foreground">Theme</p>
                  <div className="flex gap-1">
                    <button
                      className="flex flex-1 items-center justify-center gap-1 rounded bg-muted px-2 py-1 text-xs transition-colors hover:bg-muted/80"
                      title="System"
                    >
                      <Monitor className="size-3.5" />
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-1 rounded bg-muted px-2 py-1 text-xs transition-colors hover:bg-muted/80"
                      title="Light"
                    >
                      <Sun className="size-3.5" />
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-1 rounded bg-muted px-2 py-1 text-xs transition-colors hover:bg-muted/80"
                      title="Dark"
                    >
                      <Moon className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Sign out */}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => signOut()}
              >
                <SignOut className="mr-2 size-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              size="sm"
              variant="ghost"
            >
              Sign in
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/signup" />}
              size="sm"
            >
              Sign up
            </Button>
          </div>
        )}
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        chatId={chatId}
      />

      {chatId && (
        <BranchDialog
          chatId={chatId}
          open={branchDialogOpen}
          onOpenChange={setBranchDialogOpen}
        />
      )}
    </header>
  )
}
