/**
 * GitHub Integration — Repository Operations
 *
 * Listing repositories accessible to the installation, fetching repo details,
 * reading file contents, and forking repos.
 */

import { Octokit } from "@octokit/rest"
import {
  createInstallationOctokit,
  createAppOctokit,
} from "@/lib/github/auth"
import type { GitBranch, GitRepoSummary } from "@/types"

// ── List Repositories ──────────────────────────────────────

/**
 * List all repositories accessible to a GitHub App installation.
 */
export async function listRepositories(
  installationId: number,
): Promise<GitRepoSummary[]> {
  const octokit = createInstallationOctokit(installationId)
  const repos: GitRepoSummary[] = []

  const repositories = await octokit.paginate(
    octokit.rest.apps.listReposAccessibleToInstallation,
  )
  for (const repo of repositories) {
    repos.push({
      id: repo.id,
      owner: repo.owner!.login,
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      isFork: repo.fork,
      description: repo.description,
      language: repo.language,
      updatedAt: repo.updated_at ?? "",
      installationId,
    })
  }

  repos.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return repos
}

// ── Get Single Repo ───────────────────────────────────────

/**
 * Get details for a single repository.
 * For public repos, installationId is optional (uses unauthenticated API).
 * For private repos, installationId with access is required.
 */
export async function getRepo(
  owner: string,
  repo: string,
  installationId?: number,
): Promise<GitRepoSummary> {
  const octokit = installationId
    ? createInstallationOctokit(installationId)
    : new Octokit()

  const { data } = await octokit.rest.repos.get({ owner, repo })

  return {
    id: data.id,
    owner: data.owner!.login,
    name: data.name,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    isPrivate: data.private,
    isFork: data.fork,
    description: data.description,
    language: data.language,
    updatedAt: data.updated_at,
    installationId: installationId ?? 0,
  }
}

// ── File Contents ──────────────────────────────────────────

/**
 * Read a file from a repository and return its decoded contents.
 * Returns null if the file doesn't exist or if the path is a directory.
 */
export async function getFileContents(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
  installationId?: number,
): Promise<string | null> {
  const octokit = installationId
    ? createInstallationOctokit(installationId)
    : new Octokit()

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    })

    if (Array.isArray(data)) {
      return null // path is a directory
    }

    if (!("content" in data) || !data.content) {
      return null
    }

    return Buffer.from(data.content, "base64").toString("utf-8")
  } catch (error) {
    const err = error as Error & { status?: number }
    if (err.status === 404) {
      return null
    }
    throw error
  }
}

// ── Fork ───────────────────────────────────────────────────

/**
 * Fork a repository. Used when the user has read-only access
 * and needs a writable copy.
 */
export async function forkRepo(
  owner: string,
  repo: string,
  installationId: number,
  organization?: string,
): Promise<{ forkFullName: string; forkUrl: string }> {
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.repos.createFork({
    owner,
    repo,
    organization,
  })

  return {
    forkFullName: data.full_name,
    forkUrl: data.html_url,
  }
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
