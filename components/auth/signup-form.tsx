"use client"

import { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { SocialLogin } from "@/components/auth/social-login"
import { Logomark } from "@/components/brand/logomark"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEFAULT_AUTHENTICATED_REDIRECT } from "@/lib/auth-config"

export function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: DEFAULT_AUTHENTICATED_REDIRECT,
    })

    if (signUpError) {
      setError(signUpError.message ?? signUpError.statusText)
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
          <h1 className="text-2xl font-medium tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Join Flowzone and start building
          </p>
        </div>
      </div>

      {/* Desktop-only Header (Minimal) */}
      <div className="hidden space-y-1 lg:block">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started
        </p>
      </div>

      <motion.form
        variants={container}
        initial="hidden"
        animate="show"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </motion.div>

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
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </motion.div>

        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
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
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </motion.div>

        <motion.div variants={item}>
          <SocialLogin />
        </motion.div>

        <motion.p
          variants={item}
          className="text-center text-sm text-muted-foreground"
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </motion.p>
      </motion.form>
    </div>
  )
}
