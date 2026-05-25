"use client"

import { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import { SocialLogin } from "@/components/auth/social-login"
import { DEFAULT_AUTHENTICATED_REDIRECT } from "@/lib/auth-config"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { Logomark } from "@/components/brand/logomark"
import { motion } from "motion/react"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: DEFAULT_AUTHENTICATED_REDIRECT,
    })

    if (signInError) {
      setError(signInError.message ?? signInError.statusText)
      setLoading(false)
    } else {
      router.push(DEFAULT_AUTHENTICATED_REDIRECT)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-6">
      {/* Mobile-only Header */}
      <div className="flex flex-col items-center gap-2 text-center lg:hidden">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <Logomark size={28} variant="pulse" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
      </div>

      {/* Desktop-only Header (Minimal) */}
      <div className="hidden space-y-1 lg:block">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Flowzone account
        </p>
      </div>

      <motion.form
        variants={container}
        initial="hidden"
        animate="show"
        onSubmit={handleEmailSubmit}
        className="space-y-4"
      >
        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </motion.div>

        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </motion.div>

        {error && (
          <motion.p
            variants={item}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </motion.p>
        )}

        <motion.div variants={item}>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </motion.div>

        <motion.div variants={item}>
          <SocialLogin />
        </motion.div>

        <motion.p
          variants={item}
          className="text-center text-sm text-muted-foreground"
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </motion.p>
      </motion.form>
    </div>
  )
}
