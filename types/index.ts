import type { UIMessage } from "ai"

export type ProjectStatus = "active" | "archived"

export interface ProjectData {
  name: string
  envVars: Record<string, string>
}

export interface ChatData {
  title: string
  projectId?: string
}

export interface MessageData {
  role: "user" | "assistant" | "tool"
  content: string
  parts: UIMessage["parts"]
}

export type SandboxStatus = "creating" | "running" | "paused" | "stopped"

export interface SandboxData {
  e2bSandboxId: string
  templateId: string
  status: SandboxStatus
  previewUrl: string | null
  metadata: Record<string, unknown>
  expiresAt: Date
}

export type AgentRunStatus = "pending" | "running" | "completed" | "failed"

export interface AgentRunData {
  status: AgentRunStatus
  triggerRunId: string | null
  steps: number
  error: string | null
  completedAt: Date | null
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  parts: UIMessage["parts"]
  createdAt: Date
}

// ── Git / GitHub Integration ─────────────────────────────

/** Identifies a GitHub repository and how to authenticate with it */
export interface GitRepoRef {
  provider: "github"
  owner: string
  name: string
  installationId: string
}

/** A GitHub branch with metadata */
export interface GitBranch {
  name: string
  sha: string
  protected: boolean
  isDefault: boolean
}

/** Summary of a GitHub repository accessible via an installation */
export interface GitRepoSummary {
  id: number
  owner: string
  name: string
  fullName: string
  defaultBranch: string
  isPrivate: boolean
  isFork: boolean
  description: string | null
  language: string | null
  updatedAt: string
  installationId: number
}

/** Request payload for importing a repo into a chat */
export interface GitImportRequest {
  chatId: string
  repo: {
    owner: string
    name: string
    installationId: number
    branch?: string
  }
}

/** Response after importing a repo */
export interface GitImportResponse {
  gitRepoId: string
  chatBranch: string
  sandboxId: string | null
  clonePath: string
}

/** Request payload for creating a branch */
export interface GitCreateBranchRequest {
  owner: string
  repo: string
  installationId: number
  baseBranch: string
  newBranch: string
}

/** Request payload for creating a pull request */
export interface GitCreatePRRequest {
  owner: string
  repo: string
  installationId: number
  head: string
  base: string
  title: string
  body?: string
  draft?: boolean
}

/** Response from creating a pull request */
export interface GitCreatePRResponse {
  prNumber: number
  prUrl: string
  title: string
  state: string
}

/** Options for cloning a repo into an E2B sandbox */
export interface SandboxGitCloneOptions {
  url: string
  branch?: string
  depth?: number
  token: string
}

/** Options for committing changes in the sandbox */
export interface SandboxGitCommitOptions {
  repoPath: string
  message: string
  authorName?: string
  authorEmail?: string
}

/** Options for pushing changes from the sandbox */
export interface SandboxGitPushOptions {
  repoPath: string
  branch: string
  token: string
  force?: boolean
}

// ── New GitHub Domain Types ───────────────────────────────

/** A GitHub issue summary */
export interface GitIssue {
  number: number
  title: string
  state: string
  body: string | null
  user: string | undefined
  labels: (string | undefined)[]
  createdAt: string
  updatedAt: string
  comments: number
  pullRequest: boolean
}

/** A GitHub pull request summary (extended) */
export interface GitPRSummary {
  prNumber: number
  prUrl: string
  title: string
  state: string | null
  body: string | null
  draft: boolean
  user: string | undefined
  createdAt: string
  updatedAt: string
  head: { ref: string; sha: string; repoFullName: string | null }
  base: { ref: string; sha: string }
}

/** A GitHub commit summary */
export interface GitCommit {
  sha: string
  message: string
  author: string
  date: string
  url: string
  authorAvatar?: string | null
}

/** A GitHub Actions workflow summary */
export interface GitWorkflow {
  id: number
  name: string
  path: string
  state: string
  url: string
  badgeUrl: string | null
  createdAt: string
  updatedAt: string
}

/** A GitHub Actions workflow run */
export interface GitWorkflowRun {
  id: number
  name: string | null
  status: string | null
  conclusion: string | null
  branch: string
  sha: string
  url: string
  createdAt: string
  updatedAt: string
  runNumber: number
  triggeringActor: string | undefined
}

/** A GitHub release summary */
export interface GitRelease {
  id: number
  tagName: string
  name: string | null
  body: string | null
  draft: boolean
  prerelease: boolean
  url: string
  author: string | undefined
  createdAt: string
  publishedAt: string | null
}

/** A git tag summary */
export interface GitTag {
  name: string
  sha: string
  url: string
}

/** A commit status */
export interface GitCommitStatus {
  id: number
  state: string
  context: string
  description: string | null
  targetUrl: string | null
  createdAt: string
  creator: string | undefined
}

/** A check suite summary */
export interface GitCheckSuite {
  id: number
  status: string | null
  conclusion: string | null
  appName: string | undefined
  createdAt: string
  updatedAt: string
}

/** A webhook event record */
export interface WebhookEventRecord {
  id: string
  eventType: string
  action: string | null
  installationId: string | null
  processed: boolean
  processedAt: string | null
  error: string | null
  createdAt: string
}
