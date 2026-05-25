import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

export const metadata = {
  title: "Account Settings — Flowzone",
  description: "Manage your account security and preferences.",
}

export default async function AccountSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-base font-semibold">Account Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage your account security and preferences.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Password */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Password</Label>
              <p className="text-xs text-muted-foreground">
                Change your password to keep your account secure.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>

          <Separator />

          {/* Two-Factor Authentication */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>

          <Separator />

          {/* Connected Accounts */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Connected Accounts</Label>
              <p className="text-xs text-muted-foreground">
                Manage your connected social accounts.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">GitHub</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
                <Button variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <Label className="text-sm font-medium text-destructive">Danger Zone</Label>
              <p className="text-xs text-muted-foreground">
                Irreversible actions. Proceed with caution.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
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
