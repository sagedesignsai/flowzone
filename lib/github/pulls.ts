/**
 * GitHub Integration — Pull Request Operations
 *
 * Create, read, update, merge, and list pull requests.
 * Extends the existing createPullRequest with full PR lifecycle management.
 */

import { createInstallationOctokit } from "@/lib/github/auth"
import type { GitCreatePRResponse } from "@/types"
import type {
  GitHubPROptions,
  CreatePullRequestInput,
  UpdatePullRequestInput,
  MergeMethod,
} from "@/lib/github/types"

// ── Create PR ──────────────────────────────────────────────

/**
 * Create a pull request on a repository.
 */
export async function createPullRequest(
  options: GitHubPROptions & CreatePullRequestInput
): Promise<GitCreatePRResponse> {
  const { owner, repo, installationId, title, head, base, body, draft } =
    options

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

// ── Get PR ─────────────────────────────────────────────────

/**
 * Get detailed information about a pull request.
 */
export async function getPullRequest(
  options: GitHubPROptions & { prNumber: number }
) {
  const { owner, repo, prNumber, installationId } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  })

  return data
}

// ── List PRs ───────────────────────────────────────────────

/**
 * List pull requests for a repository.
 *
 * @param state - "open" | "closed" | "all" (default: "open")
 */
export async function listPullRequests(
  options: GitHubPROptions & { state?: "open" | "closed" | "all" }
) {
  const { owner, repo, installationId, state = "open" } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state,
  })

  return data.map((pr) => ({
    prNumber: pr.number,
    prUrl: pr.html_url,
    title: pr.title,
    state: pr.state,
    body: pr.body,
    draft: pr.draft,
    user: pr.user?.login,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    head: {
      ref: pr.head.ref,
      sha: pr.head.sha,
      repoFullName: pr.head.repo?.full_name,
    },
    base: {
      ref: pr.base.ref,
      sha: pr.base.sha,
    },
  }))
}

// ── Update PR ──────────────────────────────────────────────

/**
 * Update a pull request (title, body, state).
 */
export async function updatePullRequest(
  options: GitHubPROptions & {
    prNumber: number
    updates: UpdatePullRequestInput
  }
) {
  const { owner, repo, prNumber, installationId, updates } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: prNumber,
    ...updates,
  })

  return {
    prNumber: data.number,
    prUrl: data.html_url,
    title: data.title,
    state: data.state,
  }
}

// ── Merge PR ───────────────────────────────────────────────

/**
 * Merge a pull request.
 *
 * @param mergeMethod - "merge" | "squash" | "rebase" (default: "merge")
 */
export async function mergePullRequest(
  options: GitHubPROptions & {
    prNumber: number
    mergeMethod?: MergeMethod
    commitTitle?: string
    commitMessage?: string
  }
) {
  const {
    owner,
    repo,
    prNumber,
    installationId,
    mergeMethod = "merge",
    commitTitle,
    commitMessage,
  } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.pulls.merge({
    owner,
    repo,
    pull_number: prNumber,
    merge_method: mergeMethod,
    commit_title: commitTitle,
    commit_message: commitMessage,
  })

  return {
    merged: data.merged,
    message: data.message,
    sha: data.sha,
  }
}

// ── List PR Reviews ────────────────────────────────────────

/**
 * List reviews on a pull request.
 */
export async function listPullRequestReviews(
  options: GitHubPROptions & { prNumber: number }
) {
  const { owner, repo, prNumber, installationId } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: prNumber,
  })

  return data.map((review) => ({
    id: review.id,
    user: review.user?.login,
    state: review.state,
    body: review.body,
    submittedAt: review.submitted_at,
  }))
}
