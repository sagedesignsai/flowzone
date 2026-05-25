/**
 * GitHub Integration — Authentication Module
 *
 * JWT (app-level) and installation-token authentication for the GitHub REST API.
 * Uses @octokit/rest + @octokit/auth-app.
 *
 * ## Env Vars Required
 * - GITHUB_APP_ID
 * - GITHUB_PRIVATE_KEY
 */

import { Octokit } from "@octokit/rest"
import { createAppAuth } from "@octokit/auth-app"

// ── Helpers ────────────────────────────────────────────────

function getEnvOrThrow(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

// ── Auth factories ─────────────────────────────────────────

/**
 * Create an Octokit instance authenticated as the GitHub App itself (JWT).
 * Used for app-level operations like listing installations.
 */
function createAppOctokit(): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: getEnvOrThrow("GITHUB_APP_ID"),
      privateKey: getEnvOrThrow("GITHUB_PRIVATE_KEY"),
    },
  })
}

/**
 * Create an Octokit instance authenticated as a specific installation.
 * The SDK handles JWT → installation token lifecycle transparently.
 */
function createInstallationOctokit(installationId: number): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: getEnvOrThrow("GITHUB_APP_ID"),
      privateKey: getEnvOrThrow("GITHUB_PRIVATE_KEY"),
      installationId,
    },
  })
}

// ── Public API ─────────────────────────────────────────────

/**
 * Get an authenticated Octokit instance for a specific installation.
 */
export async function getInstallationOctokit(
  installationId: number,
): Promise<Octokit> {
  return createInstallationOctokit(installationId)
}

/**
 * Generate a fresh installation access token string.
 * Use this when you need a raw token (e.g. for git clone credentials).
 */
export async function getInstallationToken(
  installationId: number,
): Promise<{ token: string; expiresAt: string }> {
  const octokit = createInstallationOctokit(installationId)
  const { data } = await octokit.rest.apps.createInstallationAccessToken({
    installation_id: installationId,
  })
  return { token: data.token, expiresAt: data.expires_at }
}

// ── Internal (used by sibling modules) ─────────────────────

export { createAppOctokit, createInstallationOctokit, getEnvOrThrow }
