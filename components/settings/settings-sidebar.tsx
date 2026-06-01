"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSettingsStore } from "@/stores/settings-store"
import {
  GitBranch,
  Plugs,
  Key,
  Layout,
  Globe,
  ChartBar,
  User,
  Coin,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

// ─── Settings Sections ──────────────────────────────────────────────────────

export const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "github", label: "GitHub", icon: GitBranch },
  { id: "integrations", label: "Integrations", icon: Plugs },
  { id: "env-vars", label: "Environment Variables", icon: Key },
  { id: "template", label: "Template", icon: Layout },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "analytics", label: "Analytics", icon: ChartBar },
  { id: "billing", label: "Billing", icon: Coin },
]

// ─── Props ──────────────────────────────────────────────────────────────────

interface SettingsSidebarProps {
  mode?: "dialog" | "page"
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SettingsSidebar({ mode = "dialog" }: SettingsSidebarProps) {
  const pathname = usePathname()
  const storeActiveSection = useSettingsStore((s) => s.activeSection)
  const setActiveSection = useSettingsStore((s) => s.setActiveSection)

  const activeSection =
    mode === "page"
      ? pathname.split("/").pop() ?? "github"
      : storeActiveSection

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {SETTINGS_SECTIONS.map((section) => (
              <SidebarMenuItem key={section.id}>
                {mode === "page" ? (
                  <Link
                    href={`/settings/${section.id}`}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs",
                      "transition-colors hover:bg-muted",
                      activeSection === section.id && "bg-accent font-medium"
                    )}
                  >
                    <section.icon className="size-4" />
                    <span>{section.label}</span>
                  </Link>
                ) : (
                  <SidebarMenuButton
                    isActive={activeSection === section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "cursor-pointer",
                      activeSection === section.id && "bg-accent"
                    )}
                  >
                    <section.icon className="size-4" />
                    <span>{section.label}</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
