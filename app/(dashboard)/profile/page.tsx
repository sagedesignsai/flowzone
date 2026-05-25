import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

export const metadata = {
  title: "Profile — Flowzone",
  description: "Manage your profile information.",
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const user = session.user
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-base font-semibold">Profile</h1>
        <p className="text-xs text-muted-foreground">
          Manage your profile information.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Avatar */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                Change Picture
              </Button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              defaultValue={user?.name ?? ""}
              placeholder="Your name"
              className="text-xs"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              defaultValue={user?.email ?? ""}
              disabled
              className="text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button>Save Changes</Button>
            <Button variant="outline">
              <Link href="/settings">Back to Settings</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
