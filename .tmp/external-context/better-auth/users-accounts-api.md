---
source: Official Better Auth Docs
library: Better Auth
package: better-auth
topic: Users & Accounts API Reference
fetched: 2026-05-26T10:00:00Z
official_docs: https://www.better-auth.com/docs/concepts/users-accounts
---

# Better Auth Users & Accounts API Reference

## Account Linking Methods

### `linkSocial()` — Client

Link a social provider account to the current user:

```ts
import { authClient } from "@/lib/auth-client"

// Basic linking
await authClient.linkSocial({
  provider: "google",
  callbackURL: "/callback"
})

// With additional scopes
await authClient.linkSocial({
  provider: "google",
  callbackURL: "/callback",
  scopes: ["https://www.googleapis.com/auth/drive.readonly"]
})

// With ID token (no redirect, e.g. native SDK)
await authClient.linkSocial({
  provider: "google",
  idToken: {
    token: "id_token",
    nonce: "nonce",            // optional
    accessToken: "access",     // optional
    refreshToken: "refresh"    // optional
  }
})
```

### `listAccounts()` — Client

List all accounts linked to the current user:

```ts
const accounts = await authClient.listAccounts()
```

### `unlinkAccount()` — Client

Unlink a provider account:

```ts
await authClient.unlinkAccount({
  providerId: "google"
})

// Unlink specific account by accountId
await authClient.unlinkAccount({
  providerId: "google",
  accountId: "123"
})
```

### `setPassword()` — Server Only

Set a password for OAuth-only users (enables email/password login):

```ts
import { auth } from "@/lib/auth"

await auth.api.setPassword({
  body: {
    newPassword: "new-password"
  },
  headers: await headers() // session cookies required
})
```

### `changePassword()` — Client & Server

```ts
// Client
const { data, error } = await authClient.changePassword({
  newPassword: "newpassword1234",
  currentPassword: "oldpassword1234",
  revokeOtherSessions: true
})

// Server
const data = await auth.api.changePassword({
  body: {
    newPassword: "newpassword1234",
    currentPassword: "oldpassword1234",
    revokeOtherSessions: true
  },
  headers: await headers()
})
```

### `verifyPassword()` — Server Only

```ts
await auth.api.verifyPassword({
  body: {
    password: "user-password"
  },
  headers: await headers() // session cookies
})
```

## Complete Auth Configuration with All Linking Options

```ts
import { betterAuth } from "better-auth"

export const auth = betterAuth({
  // Email/password auth
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    autoSignIn: true
  },

  // Social providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }
  },

  // Account settings with linking
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: "database",
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
      updateUserInfoOnLink: false
    }
  },

  // User settings
  user: {
    changeEmail: {
      enabled: false
    },
    deleteUser: {
      enabled: false
    }
  }
})
```
