---
source: Official Better Auth Docs
library: Better Auth
package: better-auth
topic: OAuth Linking Flow
fetched: 2026-05-26T10:00:00Z
official_docs: https://www.better-auth.com/docs/concepts/oauth
---

# Better Auth OAuth Linking Flow

## How Account Linking Works During OAuth Sign-In

When a user signs in with an OAuth provider (e.g., GitHub) and an account with the same email already exists, Better Auth's linking logic runs as follows:

### Trust Check Flow

1. **If `account.accountLinking.enabled === false`**: Linking is denied outright → `account_not_linked` error
2. **If provider is in `trustedProviders`**: Auto-link is allowed, **bypassing email verification**
3. **If provider is NOT in `trustedProviders`**:
   - If the OAuth provider returns `emailVerified: true` → auto-link succeeds
   - If `emailVerified: false` or missing → auto-link is denied → `account_not_linked` error

### GitHub-Specific Behavior

GitHub generally returns `emailVerified: true` via its API, so:
- GitHub can auto-link to existing email/password accounts **even without `trustedProviders`**
- Exception: If the GitHub user has set their primary email to private, `GET /user` returns `email: null`, making email matching impossible

To work around private GitHub emails, use `mapProfileToUser`:

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

## Configuring GitHub Provider

```ts
import { betterAuth } from "better-auth"

export const auth = betterAuth({
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
})
```

**Important**: You MUST include the `user:email` scope in your GitHub app (it's requested by default).

### GitHub App Setup

For GitHub Apps (not OAuth apps), you must enable email reading:
1. Go to *Permissions and Events* > *Account Permissions* > *Email Addresses*
2. Set to "Read-Only"
3. Save changes

## Linking vs Sign-In

| Action | Client API | Server API |
|--------|-----------|------------|
| Sign in with GitHub | `authClient.signIn.social({ provider: "github" })` | `auth.api.signInSocial({ body: { provider: "github" } })` |
| Link GitHub account | `authClient.linkSocial({ provider: "github" })` | `auth.api.linkSocialAccount({ body: { provider: "github" } })` |
| List linked accounts | `authClient.listAccounts()` | — |
| Get access token | `authClient.getAccessToken({ providerId: "github" })` | `auth.api.getAccessToken({ body: { providerId: "github" } })` |
| Unlink account | `authClient.unlinkAccount({ providerId: "google" })` | — |

## Email/Password + GitHub Complete Setup

```ts
import { betterAuth } from "better-auth"

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false // set to true for stricter security
  },
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
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github", "google"],
      allowDifferentEmails: false
    }
  }
})
```

## Error Handling

| Error | Meaning | Resolution |
|-------|---------|------------|
| `account_not_linked` | Provider couldn't auto-link to existing user | Enable `trustedProviders` or ensure email is verified |
| `email_not_found` | Provider didn't return an email | Use `mapProfileToUser` to synthesize placeholder |
| `account_already_linked_to_different_user` | Provider account belongs to another user | User must unlink from other account first |
| `email_doesn't_match` | Provider email doesn't match user's email | Enable `allowDifferentEmails` |
