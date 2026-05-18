import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import type { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * Auth layout — redirects already-authenticated users to the home page.
 * Centering is handled by individual page components.
 */
export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/")
  }

  return <>{children}</>
}
