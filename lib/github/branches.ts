/**
 * GitHub Integration — Branch Operations
 *
 * List, create, and delete branches on a repository.
 * Fixes APP-001: isDefault is now determined via a `defaultBranch` parameter
 * rather than being hardcoded to false.
 */

import { Octokit } from "@octokit/rest"
import { createInstallationOctokit } from "@/lib/github/auth"
import type { GitBranch } from "@/types"
import type {
  ListBranchesOptions,
  CreateBranchInput,
  DeleteBranchInput,
} from "@/lib/github/types"

// ── List Branches ──────────────────────────────────────────

/**
 * List branches for a repository.
 *
 * When `defaultBranch` is provided in options, each returned branch will
 * have `isDefault` correctly set by comparing against that name.
 */
export async function listBranches(
  options: ListBranchesOptions
): Promise<GitBranch[]> {
  const { owner, repo, installationId, defaultBranch } = options
  const octokit = installationId
    ? createInstallationOctokit(installationId)
    : new Octokit()

  const { data } = await octokit.rest.repos.listBranches({ owner, repo })

  return data.map((branch) => ({
    name: branch.name,
    sha: branch.commit.sha,
    protected: branch.protected,
    isDefault: branch.name === defaultBranch,
  }))
}

// ── Create Branch ──────────────────────────────────────────

/**
 * Create a new branch from an existing reference.
 *
 * 1. Gets the latest commit SHA from the base branch
 * 2. Creates a new ref pointing to that SHA
 */
export async function createBranch(
  input: CreateBranchInput
): Promise<GitBranch> {
  const { owner, repo, baseBranch, newBranch, installationId } = input
  const octokit = createInstallationOctokit(installationId)

  // Get the SHA of the HEAD commit on the base branch
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  })

  // Create a new ref for the branch
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

// ── Delete Branch ──────────────────────────────────────────

/**
 * Delete a branch from a repository.
 */
export async function deleteBranch(input: DeleteBranchInput): Promise<void> {
  const { owner, repo, branch, installationId } = input
  const octokit = createInstallationOctokit(installationId)

  await octokit.rest.git.deleteRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  })
}

// ── Backward-compatible wrappers ───────────────────────────

/**
 * Legacy wrapper: list branches without requiring options object.
 * @deprecated Use listBranches({ owner, repo, installationId, defaultBranch }) instead.
 */
export async function listBranchesLegacy(
  owner: string,
  repo: string,
  installationId?: number,
  defaultBranch?: string
): Promise<GitBranch[]> {
  return listBranches({ owner, repo, installationId, defaultBranch })
}
