import { ProfileForm } from "@/components/settings/profile-form"
import { SettingsSection } from "@/components/settings/settings-section"

export const metadata = {
  title: "Settings — Flowzone",
  description: "Manage your account settings.",
}

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-base font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-8">
          <SettingsSection
            title="Profile"
            description="Update your name and profile photo."
          >
            <ProfileForm />
          </SettingsSection>

          <SettingsSection
            title="Preferences"
            description="Appearance and editor preferences."
          >
            <p className="text-xs text-muted-foreground">
              More preferences coming soon.
            </p>
          </SettingsSection>
        </div>
      </div>
    </div>
  )
}
