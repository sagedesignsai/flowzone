---
source: Official Better Auth Docs
library: Better Auth
package: better-auth
topic: Account Linking Configuration
fetched: 2026-05-26T10:00:00Z
official_docs: https://www.better-auth.com/docs/reference/options#accountLinking
---

# Better Auth Account Linking Configuration

## Overview

Account linking is **enabled by default** and lets users associate multiple authentication methods with a single account. With Better Auth, users can connect additional social sign-ons or OAuth providers to their existing accounts if the provider confirms the user's email as verified.

If account linking is disabled, no accounts can be linked, regardless of the provider or email verification status.

## `account.accountLinking` Options

Configured under the `account` section of your `betterAuth()` call:

```ts
import { betterAuth } from "better-auth"

export const auth = betterAuth({
  account: {
    modelName: "accounts",
    fields: {
      userId: "user_id"
    },
    encryptOAuthTokens: true,
    storeStateStrategy: "database",     // "cookie" or "database"
    storeAccountCookie: true,           // Store account data after OAuth flow in a cookie
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "email-password"],
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
      updateUserInfoOnLink: false
    }
  },
})
```

### Option Details

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable account linking entirely |
| `trustedProviders` | `string[]` \| `(request?: Request) => Promise<string[]>` | `[]` | List of providers that can auto-link without email verification. Can be static or an async function. |
| `allowDifferentEmails` | `boolean` | `false` | Allow users to link accounts with different email addresses |
| `allowUnlinkingAll` | `boolean` | `false` | Allow users to unlink ALL accounts (risk of lockout) |
| `updateUserInfoOnLink` | `boolean` | `false` | Update user info from newly linked account provider |

## `trustedProviders` Configuration

### Static Array (simple)

```ts
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "github", "email-password"]
  }
}
```

### Dynamic Function (advanced)

Use when providers need to be resolved per-request (e.g., dynamic tenant/saml providers):

```ts
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: async (request?: Request) => {
      // request is undefined during initialization
      if (!request) {
        return ["google", "github"] // defaults
      }
      // Per-request dynamic resolution
      const tenant = request.headers.get("x-tenant-id")
      if (tenant === "enterprise") {
        return ["google", "github", "saml", "email-password"]
      }
      return ["google", "github"]
    }
  }
}
```

**Important notes:**
- The function is called during context init (with `request` undefined) and again on each request
- It must be resilient to `request` being undefined
- Similar pattern to `trustedOrigins` dynamic resolution

## How Trusted Providers Work for Auto-Linking

### Default Behavior (No Trusted Providers)

By default, when a user signs in with a social provider (e.g., GitHub) and the email matches an existing email/password account:

- If the provider returns `emailVerified: true`, the accounts **are automatically linked**
- If the provider does NOT return `emailVerified: true`, linking is blocked and an `account_not_linked` error is returned

### With Trusted Providers

When you add a provider to `trustedProviders`, auto-linking will happen **even if the provider doesn't confirm email verification**. This is called **forced linking**.

```ts
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["github"] // GitHub OAuth will auto-link even without email verification
  }
}
```

**⚠️ Use with caution:** Forced linking bypasses email verification checks, which may increase the risk of account takeover.

### GitHub + Email/Password Auto-Linking

To allow GitHub OAuth to automatically link to existing email/password accounts:

```ts
import { betterAuth } from "better-auth"

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    }
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "email-password"]
    }
  }
})
```

**Notes:**
- GitHub generally returns `emailVerified: true`, so auto-linking usually works even without `trustedProviders`
- If the user has set their email to private on GitHub, GitHub may return `email: null`. In that case, use `mapProfileToUser` to synthesize a placeholder email, or GitHub won't be able to match the existing user by email at all

## Manual Account Linking

Users already signed in can manually link additional accounts:

### Link Social Account
```ts
import { authClient } from "@/lib/auth-client"

await authClient.linkSocial({
  provider: "google",
  callbackURL: "/callback"
})
```

### Link with Additional Scopes
```ts
await authClient.linkSocial({
  provider: "google",
  callbackURL: "/callback",
  scopes: ["https://www.googleapis.com/auth/drive.readonly"]
})
```

### Link with ID Token (no redirect)
```ts
await authClient.linkSocial({
  provider: "google",
  idToken: {
    token: "id_token_from_provider",
    nonce: "nonce_used_for_token",      // optional
    accessToken: "access_token",        // optional
    refreshToken: "refresh_token"       // optional
  }
})
```

### Link Credential Account (set password for OAuth users)
```ts
// Server-side only
import { auth } from "@/lib/auth"

await auth.api.setPassword({
  body: {
    newPassword: "new-password"
  },
  headers: await headers() // session cookies required
})
```

## Account Unlinking

```ts
import { authClient } from "@/lib/auth-client"

// Unlink a provider
await authClient.unlinkAccount({
  providerId: "google"
})

// Unlink a specific account by accountId
await authClient.unlinkAccount({
  providerId: "google",
  accountId: "123"
})
```

By default, users cannot unlink their last remaining account. To allow this:

```ts
account: {
  accountLinking: {
    allowUnlinkingAll: true
  }
}
```

## Handling Providers Without Email

If a provider doesn't return an email (e.g., GitHub with private email, or Apple after first sign-in), you can use `mapProfileToUser`:

```ts
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    mapProfileToUser: (profile) => ({
      email: profile.email ?? `${profile.id}@github.placeholder.local`
    })
  }
}
```

This is critical for GitHub auto-linking because if no email is returned, Better Auth cannot match the GitHub account to an existing user by email.
