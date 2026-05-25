/**
 * GitHub Integration — Issue Operations
 *
 * List, create, and comment on GitHub issues.
 */

import { createInstallationOctokit } from "@/lib/github/auth"
import type {
  GitHubPROptions,
  CreateIssueInput,
  IssueCommentInput,
} from "@/lib/github/types"

// ── List Issues ────────────────────────────────────────────

/**
 * List issues for a repository.
 *
 * @param state - "open" | "closed" | "all" (default: "open")
 */
export async function listIssues(
  options: GitHubPROptions & { state?: "open" | "closed" | "all" }
) {
  const { owner, repo, installationId, state = "open" } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state,
    sort: "updated",
    direction: "desc",
  })

  return data.map((issue) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    body: issue.body,
    user: issue.user?.login,
    labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name)),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    comments: issue.comments,
    pullRequest: !!issue.pull_request,
  }))
}

// ── Create Issue ───────────────────────────────────────────

/**
 * Create an issue on a repository.
 */
export async function createIssue(options: GitHubPROptions & CreateIssueInput) {
  const { owner, repo, installationId, title, body, labels, assignees } =
    options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body: body ?? "",
    labels: labels ?? [],
    assignees: assignees ?? [],
  })

  return {
    number: data.number,
    title: data.title,
    state: data.state,
    url: data.html_url,
    createdAt: data.created_at,
  }
}

// ── Get Issue ──────────────────────────────────────────────

/**
 * Get a single issue by number.
 */
export async function getIssue(
  options: GitHubPROptions & { issueNumber: number }
) {
  const { owner, repo, issueNumber, installationId } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  })

  return {
    number: data.number,
    title: data.title,
    state: data.state,
    body: data.body,
    user: data.user?.login,
    labels: data.labels.map((l) => (typeof l === "string" ? l : l.name)),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    comments: data.comments,
  }
}

// ── Add Comment ────────────────────────────────────────────

/**
 * Add a comment to an issue or pull request.
 */
export async function addIssueComment(
  options: GitHubPROptions & { issueNumber: number } & IssueCommentInput
) {
  const { owner, repo, issueNumber, installationId, body } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  })

  return {
    id: data.id,
    body: data.body,
    user: data.user?.login,
    createdAt: data.created_at,
    url: data.html_url,
  }
}

// ── Update Issue ───────────────────────────────────────────

/**
 * Update an issue (title, body, state, labels).
 */
export async function updateIssue(
  options: GitHubPROptions & {
    issueNumber: number
    updates: {
      title?: string
      body?: string
      state?: "open" | "closed"
      labels?: string[]
    }
  }
) {
  const { owner, repo, issueNumber, installationId, updates } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    ...updates,
  })

  return {
    number: data.number,
    title: data.title,
    state: data.state,
    url: data.html_url,
  }
}
