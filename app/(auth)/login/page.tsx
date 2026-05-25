import { LoginForm } from "@/components/auth/login-form"
import { AuthHero } from "@/components/auth/auth-hero"

export const metadata = {
  title: "Sign In — Flowzone",
  description: "Sign in to your Flowzone account",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full overflow-hidden">
      {/* Branding Side */}
      <AuthHero className="w-1/2 flex-none" />

      {/* Form Side */}
      <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 lg:p-12 dark:bg-zinc-950/50">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
