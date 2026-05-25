"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import { SettingsSidebar } from "@/components/settings/settings-sidebar"
import { GitHubSection } from "@/components/settings/settings-sections/github-section"
import { IntegrationsSection } from "@/components/settings/settings-sections/integrations-section"
import { EnvVarsSection } from "@/components/settings/settings-sections/env-vars-section"
import { TemplateSection } from "@/components/settings/settings-sections/template-section"
import { DomainsSection } from "@/components/settings/settings-sections/domains-section"
import { AnalyticsSection } from "@/components/settings/settings-sections/analytics-section"
import { useSettingsStore } from "@/stores/settings-store"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WarningCircle, CheckCircle } from "@phosphor-icons/react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatId?: string
}

const SECTION_COMPONENTS: Record<
  string,
  React.ComponentType<{ chatId?: string }>
> = {
  github: GitHubSection,
  integrations: IntegrationsSection,
  "env-vars": EnvVarsSection,
  template: TemplateSection,
  domains: DomainsSection,
  analytics: AnalyticsSection,
}

export function SettingsDialog({
  open,
  onOpenChange,
  chatId,
}: SettingsDialogProps) {
  const activeSection = useSettingsStore((s) => s.activeSection)
  const message = useSettingsStore((s) => s.message)
  const setMessage = useSettingsStore((s) => s.setMessage)

  const SectionComponent = SECTION_COMPONENTS[activeSection]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[900px] lg:max-w-[1000px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your project settings and preferences.
        </DialogDescription>

        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SettingsSidebar />
          </Sidebar>

          <main className="flex h-[500px] flex-1 flex-col overflow-hidden">
            {/* Header */}
            <header className="flex h-12 shrink-0 items-center border-b border-border px-4">
              <h2 className="text-sm font-semibold capitalize">
                {activeSection.replace("-", " ")}
              </h2>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {message && (
                <div className="mb-4">
                  <Alert
                    variant={
                      message.type === "error" ? "destructive" : "default"
                    }
                  >
                    {message.type === "error" ? (
                      <WarningCircle className="size-4" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                </div>
              )}

              {SectionComponent && <SectionComponent chatId={chatId} />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
