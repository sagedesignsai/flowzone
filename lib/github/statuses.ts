/**
 * GitHub Integration — Commit Status Operations
 *
 * Create and list commit statuses (check runs / CI status).
 */

import { createInstallationOctokit } from "@/lib/github/auth"
import type {
  GitHubPROptions,
  CreateCommitStatusInput,
} from "@/lib/github/types"

// ── Create Commit Status ───────────────────────────────────

/**
 * Create a commit status (e.g., for CI pipelines).
 */
export async function createCommitStatus(
  options: GitHubPROptions & {
    sha: string
    status: CreateCommitStatusInput
  }
) {
  const { owner, repo, sha, installationId, status } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state: status.state,
    target_url: status.targetUrl,
    description: status.description,
    context: status.context,
  })

  return {
    id: data.id,
    state: data.state,
    context: data.context,
    description: data.description,
    targetUrl: data.target_url,
    createdAt: data.created_at,
  }
}

// ── List Commit Statuses ───────────────────────────────────

/**
 * List commit statuses for a given ref.
 */
export async function listCommitStatuses(
  options: GitHubPROptions & { ref: string }
) {
  const { owner, repo, ref, installationId } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.repos.listCommitStatusesForRef({
    owner,
    repo,
    ref,
  })

  return data.map((status) => ({
    id: status.id,
    state: status.state,
    context: status.context,
    description: status.description,
    targetUrl: status.target_url,
    createdAt: status.created_at,
    creator: status.creator?.login,
  }))
}

// ── List Check Suites ──────────────────────────────────────

/**
 * List check suites for a given commit SHA.
 */
export async function listCheckSuites(
  options: GitHubPROptions & { ref: string }
) {
  const { owner, repo, ref, installationId } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.checks.listSuitesForRef({
    owner,
    repo,
    ref,
  })

  return data.check_suites.map((suite) => ({
    id: suite.id,
    status: suite.status,
    conclusion: suite.conclusion,
    appName: suite.app?.name,
    createdAt: suite.created_at,
    updatedAt: suite.updated_at,
  }))
}
