import { SettingsDialog } from "@/components/settings/settings-dialog"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Settings — Flowzone",
  description: "Manage your account settings and preferences.",
}

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-base font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage your account and project settings.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <SettingsDialog open={true} onOpenChange={() => {}} />
        </div>
      </div>
    </div>
  )
}
