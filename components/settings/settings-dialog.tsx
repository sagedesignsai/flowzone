"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import { SettingsSidebar, SETTINGS_SECTIONS } from "@/components/settings/settings-sidebar"
import { ProfileForm } from "@/components/settings/profile-form"
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
  showCloseButton?: boolean
}

const SECTION_COMPONENTS: Record<
  string,
  React.ComponentType<{ chatId?: string }>
> = {
  profile: ProfileForm,
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
  showCloseButton = true,
}: SettingsDialogProps) {
  const activeSection = useSettingsStore((s) => s.activeSection)
  const message = useSettingsStore((s) => s.message)
  const setMessage = useSettingsStore((s) => s.setMessage)

  const searchParams = useSearchParams()

  // Show OAuth error from GitHub callback redirect
  useEffect(() => {
    if (searchParams.get("oauth_error") === "true") {
      setMessage({
        type: "error",
        text: "Failed to link GitHub account. The account may already be associated with a different email, or the linking was cancelled.",
      })
    }
  }, [searchParams, setMessage])

  const setActiveSection = useSettingsStore((s) => s.setActiveSection)
  const section = activeSection ?? "profile"
  const SectionComponent = SECTION_COMPONENTS[section]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        showBackdrop={showCloseButton}
        className="overflow-hidden p-0 md:max-h-[85vh] md:max-w-[900px] lg:max-w-[1000px]"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your project settings and preferences.
        </DialogDescription>

        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SettingsSidebar />
          </Sidebar>

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Mobile section selector */}
            <div className="flex md:hidden">
              <Select
                value={section}
                onValueChange={setActiveSection}
              >
                <SelectTrigger className="rounded-none border-0 border-b border-border px-4">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {SETTINGS_SECTIONS.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      <div className="flex items-center gap-2">
                        <section.icon className="size-3.5" />
                        {section.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop header */}
            <header className="hidden h-12 shrink-0 items-center border-b border-border px-4 md:flex">
              <h2 className="text-sm font-semibold capitalize">
                {section.replace("-", " ")}
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
