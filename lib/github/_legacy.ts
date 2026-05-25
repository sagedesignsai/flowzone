/**
 * GitHub Integration Service
 *
 * Provides authenticated access to the GitHub REST API via a GitHub App.
 * Uses @octokit/rest + @octokit/auth-app for JWT generation and
 * installation token management.
 *
 * ## Authentication Model
 *
 * Two modes:
 *   1. **App-level (JWT)** — for listing installations, app metadata
 *   2. **Installation-level** — for repo operations, managed per-installation
 *
 * Installation tokens are short-lived (1 hour). We generate a fresh token for
 * each operation via the auth strategy, which caches tokens internally.
 *
 * ## Setup
 * Requires these env vars:
 *   GITHUB_APP_ID       — App ID from GitHub App settings
 *   GITHUB_PRIVATE_KEY  — RSA private key (PEM) from GitHub App
 *
 * ## Usage
 * ```ts
 * import { github } from "@/lib/github"
 *
 * // List repos accessible to an installation
 * const repos = await github.listRepositories(installationId)
 *
 * // Create a new branch
 * const branch = await github.createBranch("owner", "repo", "main", "feature/abc", 123)
 * ```
 */

import { Octokit } from "@octokit/rest"
import { createAppAuth } from "@octokit/auth-app"
import type { GitBranch, GitCreatePRResponse, GitRepoSummary } from "@/types"

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
 *
 * @param installationId — The GitHub App installation to act as
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

// ── Authentication ─────────────────────────────────────────

/**
 * Get an authenticated Octokit instance for a specific installation.
 * Each call creates a fresh instance – the SDK caches the JWT internally.
 *
 * @param installationId — GitHub App installation ID
 */
export async function getInstallationOctokit(
  installationId: number
): Promise<Octokit> {
  return createInstallationOctokit(installationId)
}

/**
 * Generate a fresh installation access token string.
 * Use this when you need a raw token (e.g. for git clone credentials).
 *
 * @param installationId — GitHub App installation ID
 * @returns The token string and its expiry ISO date
 */
export async function getInstallationToken(
  installationId: number
): Promise<{ token: string; expiresAt: string }> {
  const octokit = createInstallationOctokit(installationId)
  const { data } = await octokit.rest.apps.createInstallationAccessToken({
    installation_id: installationId,
  })
  return { token: data.token, expiresAt: data.expires_at }
}

// ── Repositories ───────────────────────────────────────────

/**
 * List all repositories accessible to a GitHub App installation.
 *
 * @param installationId — The installation to query
 * @returns Sorted list of repo summaries (most recently updated first)
 */
export async function listRepositories(
  installationId: number
): Promise<GitRepoSummary[]> {
  const octokit = createInstallationOctokit(installationId)
  // Use pagination to get all repos
  const repos: GitRepoSummary[] = []

  const repositories = await octokit.paginate(
    octokit.rest.apps.listReposAccessibleToInstallation
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

  // Sort: recently updated first
  repos.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return repos
}

/**
 * Get details for a single repository.
 * For public repos, installationId is optional (uses unauthenticated API).
 * For private repos, installationId with access is required.
 */
export async function getRepo(
  owner: string,
  repo: string,
  installationId?: number
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

// ── Branches ───────────────────────────────────────────────

/**
 * List branches for a repository.
 */
export async function listBranches(
  owner: string,
  repo: string,
  installationId?: number
): Promise<GitBranch[]> {
  const octokit = installationId
    ? createInstallationOctokit(installationId)
    : new Octokit()

  const { data } = await octokit.rest.repos.listBranches({ owner, repo })

  return data.map((branch) => ({
    name: branch.name,
    sha: branch.commit.sha,
    protected: branch.protected,
    isDefault: false,
  }))
}

/**
 * Create a new branch in a repository from an existing reference.
 *
 * 1. Gets the latest commit SHA from the base branch
 * 2. Creates a new ref pointing to that SHA
 *
 * @param owner — Repo owner
 * @param repo — Repo name
 * @param baseBranch — Source branch (e.g. "main")
 * @param newBranch — Name for the new branch (e.g. "flowzone/abc123")
 * @param installationId — GitHub App installation with write access
 */
export async function createBranch(
  owner: string,
  repo: string,
  baseBranch: string,
  newBranch: string,
  installationId: number
): Promise<GitBranch> {
  const octokit = createInstallationOctokit(installationId)

  // 1. Get the SHA of the HEAD commit on the base branch
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  })

  // 2. Create a new ref for the branch
  const { data: newRef } = await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranch}`,
    sha: refData.object.sha,
  })

  return {
    name: newBranch,
    sha: newRef.object.sha,
    protected: false,
    isDefault: false,
  }
}

// ── Pull Requests ──────────────────────────────────────────

/**
 * Create a pull request on a repository.
 *
 * @param owner — Repo owner
 * @param repo — Repo name
 * @param head — Branch with changes (e.g. "flowzone/abc123")
 * @param base — Target branch (e.g. "main")
 * @param title — PR title
 * @param body — PR description (optional)
 * @param installationId — GitHub App installation with write access
 * @param draft — Create as draft PR (optional)
 */
export async function createPullRequest(
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body?: string,
  installationId?: number,
  draft?: boolean
): Promise<GitCreatePRResponse> {
  if (!installationId) {
    throw new Error("installationId is required to create a pull request")
  }

  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body: body ?? "",
    draft: draft ?? false,
  })

  return {
    prNumber: data.number,
    prUrl: data.html_url,
    title: data.title,
    state: data.state,
  }
}

// ── Forking ────────────────────────────────────────────────

/**
 * Fork a repository.
 * Used when the user has read-only access and needs a writable copy.
 *
 * @param owner — Original repo owner
 * @param repo — Original repo name
 * @param installationId — Installation that has access to the source repo
 * @param organization — Org to fork to (optional, defaults to user's account)
 */
export async function forkRepo(
  owner: string,
  repo: string,
  installationId: number,
  organization?: string
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

// ── File Contents ──────────────────────────────────────────

/**
 * Read a file from a repository and return its decoded contents.
 *
 * @param owner — Repo owner
 * @param repo — Repo name
 * @param path — File path within the repo
 * @param ref — Branch, tag, or commit SHA (defaults to repo default)
 * @param installationId — Required for private repos
 * @returns Decoded file content, or null if the file doesn't exist
 */
export async function getFileContents(
  owner: string,
  repo: string,
  path: string,
  ref?: string,
  installationId?: number
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

    // Content is base64-encoded
    return Buffer.from(data.content, "base64").toString("utf-8")
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return null
    }
    throw error
  }
}

// ── Installations ──────────────────────────────────────────

/**
 * List all installations of the GitHub App.
 * Uses JWT authentication (app-level).
 */
export async function listInstallations(): Promise<
  {
    id: number
    accountLogin: string
    accountType: string
    reposCount: number
  }[]
> {
  const octokit = createAppOctokit()
  const { data: installations } = await octokit.rest.apps.listInstallations()

  return installations.map((inst) => ({
    id: inst.id,
    accountLogin: inst.account?.login ?? "unknown",
    accountType: inst.account?.type ?? "unknown",
    reposCount: 0, // repositories property is not at this level in the latest Octokit types
  }))
}

/**
 * Check if the GitHub App is installed on a specific repository and return
 * the installation ID.
 *
 * @returns The installation ID, or null if not installed.
 */
export async function getRepoInstallation(
  owner: string,
  repo: string
): Promise<{ id: number } | null> {
  try {
    const octokit = createAppOctokit()
    const { data } = await octokit.rest.apps.getRepoInstallation({
      owner,
      repo,
    })
    return { id: data.id }
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return null
    }
    throw error
  }
}

// ── Export service object ──────────────────────────────────

export const github = {
  getInstallationOctokit,
  getInstallationToken,
  listRepositories,
  getRepo,
  listBranches,
  createBranch,
  createPullRequest,
  forkRepo,
  getFileContents,
  listInstallations,
  getRepoInstallation,
}
