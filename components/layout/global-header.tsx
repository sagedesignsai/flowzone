"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIdeStore } from "@/hooks/use-ide-store";
import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CaretDown,
  Code,
  Eye,
  Gear,
  SignOut,
  Terminal as TerminalIcon,
  User,
} from "@phosphor-icons/react";
import type { ComponentProps } from "react";

// ─── View tabs ───────────────────────────────────────────────────────────────

const VIEW_TABS = [
  { mode: "preview"  as const, icon: Eye,          label: "Preview"  },
  { mode: "code"     as const, icon: Code,         label: "Code"     },
  { mode: "terminal" as const, icon: TerminalIcon, label: "Terminal" },
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

interface GlobalHeaderProps extends ComponentProps<"header"> {
  breadcrumb?: string;
  showViewTabs?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GlobalHeader({
  breadcrumb,
  showViewTabs = false,
  className,
  ...props
}: GlobalHeaderProps) {
  const { data: session } = useSession();
  const { viewMode, setViewMode } = useIdeStore();

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

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

      {/* ── Center: view-mode tabs (IDE only) ──────────────────── */}
      {showViewTabs && (
        <div className="flex flex-1 items-center justify-center gap-0.5">
          {VIEW_TABS.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs transition-colors",
                viewMode === mode
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
              onClick={() => setViewMode(mode)}
              type="button"
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Right: auth / user menu ─────────────────────────────── */}
      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs",
                    "hover:bg-muted transition-colors"
                  )}
                  type="button"
                />
              }
            >
              <Avatar className="size-5">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <span className="max-w-[120px] truncate">{user.name}</span>
              <CaretDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-medium text-xs">{user.name}</p>
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 size-3.5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Gear className="mr-2 size-3.5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
    </header>
  );
}
