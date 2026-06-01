"use client"

import { createAuthClient } from "better-auth/react"
import { sentinelClient } from "@better-auth/infra/client";


export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [
    sentinelClient()
  ]
})

export const { signIn, signUp, signOut, useSession, linkSocial } = authClient
