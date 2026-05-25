/**
 * GitHub Integration — Installation Operations
 *
 * List GitHub App installations and check repository installation status.
 * Fixes APP-002: reposCount is now properly fetched.
 */

import { createAppOctokit, createInstallationOctokit } from "@/lib/github/auth"

// ── List Installations ─────────────────────────────────────

/**
 * List all installations of the GitHub App with accurate repo counts.
 * Uses JWT authentication (app-level).
 *
 * Fixes APP-002: queries per-installation accessible repos instead of
 * hardcoding reposCount to 0.
 */
export async function listInstallations(): Promise<
  { id: number; accountLogin: string; accountType: string; reposCount: number }[]
> {
  const octokit = createAppOctokit()
  const { data: installations } =
    await octokit.rest.apps.listInstallations()

  const results = await Promise.allSettled(
    installations.map(async (inst) => {
      let reposCount = 0
      try {
        const instOctokit = createInstallationOctokit(inst.id)
        const repos = await instOctokit.paginate(
          instOctokit.rest.apps.listReposAccessibleToInstallation,
        )
        reposCount = repos.length
      } catch {
        // If we can't fetch repo count, leave it as 0
      }

      return {
        id: inst.id,
        accountLogin: inst.account?.login ?? "unknown",
        accountType: inst.account?.type ?? "unknown",
        reposCount,
      }
    }),
  )

  return results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { id: 0, accountLogin: "error", accountType: "error", reposCount: 0 },
  ).filter((inst) => inst.id !== 0)
}

// ── Get Repo Installation ─────────────────────────────────

/**
 * Check if the GitHub App is installed on a specific repository.
 * Returns the installation ID, or null if not installed.
 */
export async function getRepoInstallation(
  owner: string,
  repo: string,
): Promise<{ id: number } | null> {
  try {
    const octokit = createAppOctokit()
    const { data } = await octokit.rest.apps.getRepoInstallation({
      owner,
      repo,
    })
    return { id: data.id }
  } catch (error) {
    const err = error as Error & { status?: number }
    if (err.status === 404) {
      return null
    }
    throw error
  }
}
