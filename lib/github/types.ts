/**
 * GitHub Integration — Internal Types
 *
 * Domain-specific types for the GitHub service layer.
 * Shared/generic types live in @/types.
 */

import type { Endpoints } from "@octokit/types"

// ── Pull Requests ─────────────────────────────────────────

export interface GitHubPROptions {
  owner: string
  repo: string
  installationId: number
}

export interface CreatePullRequestInput {
  title: string
  head: string
  base: string
  body?: string
  draft?: boolean
}

export interface UpdatePullRequestInput {
  title?: string
  body?: string
  state?: "open" | "closed"
}

export type MergeMethod = "merge" | "squash" | "rebase"

// ── Issues ────────────────────────────────────────────────

export interface CreateIssueInput {
  title: string
  body?: string
  labels?: string[]
  assignees?: string[]
}

export interface IssueCommentInput {
  body: string
}

// ── Workflows ─────────────────────────────────────────────

export interface WorkflowDispatchInput {
  workflow_id: string
  ref: string
  inputs?: Record<string, unknown>
}

// ── Releases ──────────────────────────────────────────────

export interface CreateReleaseInput {
  tagName: string
  targetCommitish?: string
  name?: string
  body?: string
  draft?: boolean
  prerelease?: boolean
}

// ── Commit Statuses ───────────────────────────────────────

export type CommitStatusState = "error" | "failure" | "pending" | "success"

export interface CreateCommitStatusInput {
  state: CommitStatusState
  targetUrl?: string
  description?: string
  context?: string
}

// ── Branches ──────────────────────────────────────────────

export interface ListBranchesOptions {
  owner: string
  repo: string
  installationId?: number
  defaultBranch?: string // if provided, isDefault will be set correctly
}

export interface CreateBranchInput {
  owner: string
  repo: string
  baseBranch: string
  newBranch: string
  installationId: number
}

export interface DeleteBranchInput {
  owner: string
  repo: string
  branch: string
  installationId: number
}

// ── Common ────────────────────────────────────────────────

export type EndpointError = Error & { status?: number }
