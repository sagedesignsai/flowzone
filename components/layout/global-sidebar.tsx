"use client";

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
} from "@/components/ui/sidebar";
import { useIdeStore } from "@/hooks/use-ide-store";
import { cn } from "@/lib/utils";
import {
  ChatTeardropDots,
  DotsThree,
  FolderSimple,
  HouseLine,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Stack,
  Trash,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// ----- Navigation Items ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Home",     icon: HouseLine,        href: "/" },
  { label: "Projects", icon: FolderSimple,      href: "/projects" },
  { label: "Chats",    icon: ChatTeardropDots,  href: "/chat" },
  { label: "Templates", icon: Stack,            href: "/templates" },
];

// ----- Component ─────────────────────────────────────────────────────────────

export function GlobalSidebar() {
  const router = useRouter();
  const { chatSessions, addChatSession, removeChatSession, setActiveChatId, activeChatId } =
    useIdeStore();
  const { open } = useSidebar();

  function handleNewChat() {
    const id = nanoid();
    addChatSession({
      id,
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setActiveChatId(id);
    router.push(`/chat/${id}`);
  }

  return (
    <Sidebar collapsible="offcanvas">
      {/* ── Header ─────────────────────────────────────────────── */}
      <SidebarHeader className="gap-0 pb-0">
        {/* Logo / brand */}
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex size-6 items-center justify-center rounded-sm bg-foreground">
            <span className="text-xs font-bold text-background">F</span>
          </div>
          {open && (
            <motion.span
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-semibold"
              initial={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
            >
              Flowzone
            </motion.span>
          )}
        </div>

        <SidebarSeparator />

        {/* New Chat button */}
        <div className="px-2 py-2">
          <Button
            className="w-full justify-start gap-2"
            onClick={handleNewChat}
            size="sm"
            variant="outline"
          >
            <Plus className="size-3.5" />
            {open && "New Chat"}
          </Button>
        </div>
      </SidebarHeader>

      {/* ── Content ────────────────────────────────────────────── */}
      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    tooltip={label}
                  >
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Search */}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Search">
                  <MagnifyingGlass className="size-4" />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Recent chats */}
        {chatSessions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="max-h-[340px]">
                <SidebarMenu>
                  {chatSessions.slice(0, 20).map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton
                        className={cn(
                          activeChatId === session.id && "data-[active=true]:bg-sidebar-accent"
                        )}
                        isActive={activeChatId === session.id}
                        render={<Link href={`/chat/${session.id}`} />}
                        onClick={() => setActiveChatId(session.id)}
                        tooltip={session.title}
                      >
                        <PencilSimple className="size-3.5 shrink-0 opacity-60" />
                        <span className="truncate">{session.title}</span>
                      </SidebarMenuButton>

                      {/* Actions menu */}
                      <SidebarMenuAction render={<span />} showOnHover>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <DotsThree className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" side="right">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => removeChatSession(session.id)}
                            >
                              <Trash className="mr-2 size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <SidebarFooter>
        <SidebarSeparator />
        <div className="px-2 py-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-sidebar-accent",
              !open && "justify-center"
            )}
          >
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px]">U</AvatarFallback>
            </Avatar>
            {open && (
              <span className="truncate text-sidebar-foreground/70">
                Personal
              </span>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
