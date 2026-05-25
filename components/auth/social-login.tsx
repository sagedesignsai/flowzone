"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { DEFAULT_AUTHENTICATED_REDIRECT } from "@/lib/auth-config"
import {
  GithubLogoIcon as GithubLogo,
  GoogleLogoIcon as GoogleLogo,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface SocialLoginProps {
  callbackURL?: string
}

export function SocialLogin({
  callbackURL = DEFAULT_AUTHENTICATED_REDIRECT,
}: SocialLoginProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  async function handleSocialSignIn(provider: "github" | "google") {
    setLoadingProvider(provider)
    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      })
    } catch (error) {
      console.error(`${provider} sign in failed:`, error)
      toast.error(`Failed to sign in with ${provider}`)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignIn("github")}
          disabled={!!loadingProvider}
          className="flex items-center gap-2"
        >
          {loadingProvider === "github" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <GithubLogo className="h-4 w-4" weight="fill" />
          )}
          GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignIn("google")}
          disabled={!!loadingProvider}
          className="flex items-center gap-2"
        >
          {loadingProvider === "google" ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <GoogleLogo className="h-4 w-4" weight="fill" />
          )}
          Google
        </Button>
      </div>
    </div>
  )
}
