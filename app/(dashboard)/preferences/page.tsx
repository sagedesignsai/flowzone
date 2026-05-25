import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SettingsCard, StatusBadge, StatsCard } from "@/components/complex"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Monitor,
  Sun,
  Moon,
  Code,
  Bell,
  GitBranch,
} from "@phosphor-icons/react/dist/ssr"

export const metadata = {
  title: "Preferences — Flowzone",
  description: "Manage your preferences and appearance.",
}

export default async function PreferencesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-base font-semibold">Preferences</h1>
        <p className="text-xs text-muted-foreground">
          Customize your experience and appearance.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3">
            <StatsCard
              icon={<Code className="size-4" />}
              label="Projects"
              value="3"
              change={{ value: 1, direction: "up" }}
              trend="positive"
            />
            <StatsCard
              icon={<GitBranch className="size-4" />}
              label="Repositories"
              value="5"
              change={{ value: 2, direction: "up" }}
              trend="positive"
            />
            <StatsCard
              icon={<Bell className="size-4" />}
              label="Notifications"
              value="12"
              change={{ value: 3, direction: "down" }}
              trend="negative"
            />
          </div>

          <Separator />

          {/* Theme */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <p className="text-xs text-muted-foreground">
                Choose your preferred color scheme.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SettingsCard
                icon={<Monitor className="size-4" />}
                title="System"
                description="Follow device settings"
                onClick={() => {}}
              />
              <SettingsCard
                icon={<Sun className="size-4" />}
                title="Light"
                description="Always light mode"
                onClick={() => {}}
              />
              <SettingsCard
                icon={<Moon className="size-4" />}
                title="Dark"
                description="Always dark mode"
                onClick={() => {}}
              />
            </div>
          </div>

          <Separator />

          {/* Editor Settings */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Editor</Label>
              <p className="text-xs text-muted-foreground">
                Configure your code editor preferences.
              </p>
            </div>
            <div className="space-y-2">
              <SettingsCard
                icon={<Code className="size-4" />}
                title="Font Size"
                description="12px"
                action={
                  <StatusBadge status="active" label="Default" size="sm" />
                }
              />
              <SettingsCard
                icon={<Code className="size-4" />}
                title="Tab Size"
                description="2 spaces"
                action={<StatusBadge status="active" label="2sp" size="sm" />}
              />
              <SettingsCard
                icon={<Code className="size-4" />}
                title="Line Numbers"
                description="Show line numbers in editor"
                toggle={{
                  enabled: true,
                  onChange: () => {},
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Manage your notification preferences.
              </p>
            </div>
            <div className="space-y-2">
              <SettingsCard
                icon={<Bell className="size-4" />}
                title="Email Notifications"
                description="Receive updates via email"
                toggle={{
                  enabled: true,
                  onChange: () => {},
                }}
              />
              <SettingsCard
                icon={<Bell className="size-4" />}
                title="Chat Notifications"
                description="Get notified about chat messages"
                toggle={{
                  enabled: true,
                  onChange: () => {},
                }}
              />
              <SettingsCard
                icon={<Bell className="size-4" />}
                title="Deployment Alerts"
                description="Notify on deployment status changes"
                toggle={{
                  enabled: false,
                  onChange: () => {},
                }}
              />
            </div>
          </div>

          {/* Back button */}
          <div className="pt-4">
            <Button variant="outline">
              <Link href="/settings">Back to Settings</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
