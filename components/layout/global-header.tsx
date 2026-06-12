"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/settings/settings-dialog"
import { useSettingsStore } from "@/stores/settings-store"
import { useCreditsStore } from "@/stores/credits-store"
import { useSession, signOut } from "@/lib/auth-client"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  CaretDown,
  Gear,
  GitBranch,
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
  CurrencyCircleDollar,
  Warning,
} from "@phosphor-icons/react"
import type { ComponentProps } from "react"
import { useState, useEffect, useCallback } from "react"
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

  // ── Theme (next-themes) ──────────────────────────────────────
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // ── Credits store ────────────────────────────────────────────
  const credits = useCreditsStore((s) => s.balance)
  const creditsError = useCreditsStore((s) => s.error)
  const fetchBalance = useCreditsStore((s) => s.fetchBalance)

  useEffect(() => {
    if (user) fetchBalance()
  }, [user, fetchBalance])

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)

  // Read GitHub connection status from persisted store
  const ghConfig = useSettingsStore((s) => s.github)

  const handleSettings = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  const handleViewBranch = useCallback(() => {
    setBranchDialogOpen(true)
  }, [])

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
        <SidebarTrigger className="-ml-1 size-6" aria-label="Toggle sidebar" />

        {breadcrumb && (
          <>
            <Separator className="h-4" orientation="vertical" />
            <span className="truncate text-muted-foreground">{breadcrumb}</span>
          </>
        )}
      </div>

      {/* ── Right: actions + auth / user menu ──────────────────── */}
      <div className="ml-auto flex items-center gap-2">
        {/* Action buttons (Settings, View Branch) */}
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
                  aria-label="Open user menu"
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
                    window.open("https://flowzone.dev/pricing", "_blank")
                  }
                >
                  <CurrencyCircleDollar className="mr-2 size-3.5" />
                  <span>Pricing</span>
                  <ArrowUpRight className="ml-auto size-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://flowzone.dev/docs", "_blank")
                  }
                >
                  <FileText className="mr-2 size-3.5" />
                  <span>Documentation</span>
                  <ArrowUpRight className="ml-auto size-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://flowzone.dev/community", "_blank")
                  }
                >
                  <Users className="mr-2 size-3.5" />
                  <span>Community Forum</span>
                  <ArrowUpRight className="ml-auto size-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://flowzone.dev/feedback", "_blank")
                  }
                >
                  <ChatCircle className="mr-2 size-3.5" />
                  <span>Feedback</span>
                  <ArrowUpRight className="ml-auto size-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://flowzone.dev/refer", "_blank")
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
                {creditsError ? (
                  <Warning className="ml-auto size-3.5 text-destructive" />
                ) : (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {credits !== null ? credits.toLocaleString() : "..."}
                  </span>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Preferences */}
              <div className="px-2 py-2">
                <p className="mb-2 text-xs font-medium">Preferences</p>
                <div className="space-y-2">
                  <p className="mb-1.5 text-xs text-muted-foreground">Theme</p>
                  {mounted ? (
                    <div className="flex gap-1">
                      <button
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-muted/80",
                          theme === "system"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted"
                        )}
                        title="System"
                        onClick={() => setTheme("system")}
                      >
                        <Monitor className="size-3.5" />
                      </button>
                      <button
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-muted/80",
                          theme === "light"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted"
                        )}
                        title="Light"
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="size-3.5" />
                      </button>
                      <button
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-muted/80",
                          theme === "dark"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted"
                        )}
                        title="Dark"
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        className="flex flex-1 items-center justify-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                        title="System"
                        disabled
                      >
                        <Monitor className="size-3.5" />
                      </button>
                      <button
                        className="flex flex-1 items-center justify-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                        title="Light"
                        disabled
                      >
                        <Sun className="size-3.5" />
                      </button>
                      <button
                        className="flex flex-1 items-center justify-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                        title="Dark"
                        disabled
                      >
                        <Moon className="size-3.5" />
                      </button>
                    </div>
                  )}
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