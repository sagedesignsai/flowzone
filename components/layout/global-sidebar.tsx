"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ChatTeardropDots,
  FolderSimple,
  GitBranch,
  Globe,
  HouseLine,
  Key,
  Layout,
  MagnifyingGlass,
  NotePencil,
  ChartBar,
  Plugs,
  Plus,
  SignOut,
  Stack,
  Trash,
  Gear,
  User,
} from "@phosphor-icons/react"
import { motion } from "motion/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { nanoid } from "nanoid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSession, signOut } from "@/lib/auth-client"
import { useState } from "react"
import { SettingsDialog } from "@/components/settings/settings-dialog"
import { Logomark } from "@/components/brand"

// ----- Navigation Items ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Home", icon: HouseLine, href: "/" },
  { label: "Projects", icon: FolderSimple, href: "/projects" },
  { label: "Chats", icon: ChatTeardropDots, href: "/chat" },
  { label: "Templates", icon: Stack, href: "/templates" },
]

const SETTINGS_ITEMS = [
  { label: "Profile", icon: User, href: "/settings/profile" },
  { label: "GitHub", icon: GitBranch, href: "/settings/github" },
  { label: "Integrations", icon: Plugs, href: "/settings/integrations" },
  { label: "Environment Variables", icon: Key, href: "/settings/env-vars" },
  { label: "Template", icon: Layout, href: "/settings/template" },
  { label: "Domains", icon: Globe, href: "/settings/domains" },
  { label: "Analytics", icon: ChartBar, href: "/settings/analytics" },
]

// ----- Helpers ───────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

// ----- Side Menu Item ────────────────────────────────────────────────────────

function SideMenuItem({
  icon: Icon,
  label,
  href,
  isActive,
}: {
  icon: React.ElementType
  label: string
  href: string
  isActive: boolean
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        render={<Link href={href} />}
        tooltip={label}
        className={cn(
          "group/menu-button relative overflow-visible",
          isActive && "font-medium"
        )}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span className="absolute inset-y-1.5 -left-2 w-0.5 rounded-full bg-sidebar-foreground" />
        )}
        <Icon
          className={cn(
            "size-4 shrink-0",
            isActive ? "opacity-100" : "opacity-70"
          )}
        />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// ----- Component ─────────────────────────────────────────────────────────────

export function GlobalSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const isSettings = pathname.startsWith("/settings")
  const { data: session } = useSession()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const {
    chatSessions,
    addChatSession,
    removeChatSession,
    setActiveChatId,
    activeChatId,
  } = useIdeStore()
  const { open } = useSidebar()

  async function handleDeleteChat(id: string) {
    try {
      await fetch(`/api/chat/${id}`, { method: "DELETE" })
    } catch {
      // Optimistic delete — proceed even if server fails
    }
    removeChatSession(id)
  }

  function handleNewChat() {
    const id = nanoid()
    addChatSession({
      id,
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    setActiveChatId(id)
    router.push(`/chat/${id}`)
  }

  const user = session?.user
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?"

  return (
    <Sidebar collapsible="offcanvas">
      {/* ── Header ─────────────────────────────────────────────── */}
      <SidebarHeader className="gap-0 pb-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 py-3.5">
          <Logomark animate={false} size={20} variant="none" />
          {open && (
            <motion.span
              animate={{ opacity: 1, x: 0 }}
              className="text-[13px] font-semibold tracking-tight"
              initial={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
            >
              {isSettings ? "Settings" : "Flowzone"}
            </motion.span>
          )}
        </div>

        {isSettings ? (
          /* Settings back button */
          <div className="px-2 pb-2">
            <Button
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/")}
              size="sm"
              variant="ghost"
            >
              <ArrowLeft className="size-3.5" />
              {open && "Back to app"}
            </Button>
          </div>
        ) : (
          /* New Chat button */
          <div className="px-2 pb-2">
            <Button
              className="w-full justify-start gap-2"
              onClick={handleNewChat}
              size="sm"
            >
              <Plus className="size-3.5" />
              {open && "New Chat"}
            </Button>
          </div>
        )}
      </SidebarHeader>

      {/* ── Content ────────────────────────────────────────────── */}
      <SidebarContent>
        {isSettings ? (
          /* Settings navigation */
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {SETTINGS_ITEMS.map(({ label, icon, href }) => (
                  <SideMenuItem
                    key={href}
                    icon={icon}
                    label={label}
                    href={href}
                    isActive={pathname === href}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            {/* Primary Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map(({ label, icon, href }) => (
                    <SideMenuItem
                      key={href}
                      icon={icon}
                      label={label}
                      href={href}
                      isActive={
                        href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(href)
                      }
                    />
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Search">
                      <MagnifyingGlass className="size-4 opacity-70" />
                      <span>Search</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            {/* Recent Chats */}
            <SidebarGroup>
              <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
              <SidebarGroupContent>
                {chatSessions.length > 0 ? (
                  <ScrollArea
                    className={cn(
                      "max-h-[280px]",
                      !open && "max-h-[200px]"
                    )}
                  >
                    <SidebarMenu>
                      {chatSessions.slice(0, 20).map((session) => (
                        <SidebarMenuItem key={session.id}>
                          <SidebarMenuButton
                            isActive={activeChatId === session.id}
                            render={<Link href={`/chat/${session.id}`} />}
                            onClick={() => setActiveChatId(session.id)}
                            tooltip={session.title}
                            className="group/menu-button"
                          >
                            <NotePencil className="size-3.5 shrink-0 opacity-50" />
                            <span className="flex-1 truncate">
                              {session.title}
                            </span>
                            {open && (
                              <span className="shrink-0 text-[10px] text-sidebar-foreground/40 tabular-nums">
                                {formatRelativeTime(session.updatedAt)}
                              </span>
                            )}
                          </SidebarMenuButton>

                          <SidebarMenuAction render={<span />} showOnHover>
                            <button
                              className="flex size-4 items-center justify-center rounded text-sidebar-foreground/50 transition-colors hover:text-destructive"
                              onClick={() => handleDeleteChat(session.id)}
                              aria-label={`Delete ${session.title}`}
                            >
                              <Trash className="size-3" />
                            </button>
                          </SidebarMenuAction>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </ScrollArea>
                ) : (
                  open && (
                    <p className="px-2 text-xs text-sidebar-foreground/40">
                      No chats yet
                    </p>
                  )
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <SidebarFooter>
        <SidebarSeparator />
        <div className="px-2 py-2">
          {open ? (
            /* Expanded user card */
            <div className="flex items-center gap-2 rounded-[5px] px-2 py-1.5 text-xs transition-colors hover:bg-sidebar-accent">
              <Avatar className="size-6 shrink-0">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[12px] font-medium leading-tight">
                  {user?.name ?? "User"}
                </span>
                <span className="truncate text-[10px] text-sidebar-foreground/50 leading-tight">
                  {user?.email ?? ""}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  className="flex size-6 items-center justify-center rounded text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Settings"
                >
                  <Gear className="size-3.5" />
                </button>
                <button
                  className="flex size-6 items-center justify-center rounded text-sidebar-foreground/50 transition-colors hover:text-destructive"
                  onClick={() => signOut()}
                  aria-label="Sign out"
                >
                  <SignOut className="size-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Collapsed: just avatar */
            <div className="flex justify-center">
              <Avatar className="size-6">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </SidebarFooter>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </Sidebar>
  )
}
