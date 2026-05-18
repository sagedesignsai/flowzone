import { SignupForm } from "./signup-form"

export const metadata = {
  title: "Create Account — Flowzone",
  description: "Create your Flowzone account",
}

export default function SignupPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-medium tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Get started with Flowzone
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
