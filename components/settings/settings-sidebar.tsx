"use client"

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
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

// ─── Settings Sections ──────────────────────────────────────────────────────

const SECTIONS = [
  { id: "github", label: "GitHub", icon: GitBranch },
  { id: "integrations", label: "Integrations", icon: Plugs },
  { id: "env-vars", label: "Environment Variables", icon: Key },
  { id: "template", label: "Template", icon: Layout },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "analytics", label: "Analytics", icon: ChartBar },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function SettingsSidebar() {
  const activeSection = useSettingsStore((s) => s.activeSection)
  const setActiveSection = useSettingsStore((s) => s.setActiveSection)

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {SECTIONS.map((section) => (
              <SidebarMenuItem key={section.id}>
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
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
