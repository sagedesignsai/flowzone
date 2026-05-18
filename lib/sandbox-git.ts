/**
 * Sandbox Git Operations
 *
 * Provides git operations inside an E2B sandbox environment.
 * These functions work with an active Sandbox instance from the `e2b` SDK
 * and the built-in `sandbox.git.*` methods for clone/push/pull operations,
 * plus raw git commands via `sandbox.commands.run()` for commits, diffs, etc.
 *
 * ## Usage
 * ```ts
 * import { Sandbox } from "e2b"
 * import { sandboxGit } from "@/lib/sandbox-git"
 *
 * const sandbox = await Sandbox.create()
 *
 * // Clone a private repo
 * await sandboxGit.cloneRepo(sandbox, {
 *   url: "https://github.com/owner/repo.git",
 *   branch: "main",
 *   depth: 1,
 *   token: "github_installation_token",
 * })
 *
 * // Auto-commit changes
 * await sandboxGit.autoCommit(sandbox, {
 *   repoPath: "/home/user/repo",
 *   message: "AI-generated changes",
 * })
 * ```
 */

import type { Sandbox } from "e2b"
import type { SandboxGitCommitOptions, SandboxGitPushOptions } from "@/types"

// ── Constants ──────────────────────────────────────────────

const DEFAULT_REPO_PATH = "/home/user/repo"
const GIT_USERNAME = "x-access-token"

// ── Clone ──────────────────────────────────────────────────

export interface CloneOptions {
  /** Full HTTPS git URL (e.g. https://github.com/owner/repo.git) */
  url: string
  /** Branch to checkout after clone (defaults to repo default) */
  branch?: string
  /** Shallow clone depth (omit for full clone) */
  depth?: number
  /** GitHub installation token or PAT */
  token: string
  /** Path in the sandbox to clone into */
  path?: string
}

/**
 * Clone a git repository into the E2B sandbox.
 * Supports public repos (no auth needed) and private repos (via token).
 *
 * The `x-access-token` username tells GitHub to accept an installation token
 * or PAT as the password.
 */
export async function cloneRepo(
  sandbox: Sandbox,
  options: CloneOptions,
): Promise<{ repoPath: string }> {
  const repoPath = options.path ?? DEFAULT_REPO_PATH

  await sandbox.git.clone(options.url, {
    path: repoPath,
    branch: options.branch,
    depth: options.depth,
    username: GIT_USERNAME,
    password: options.token,
  })

  return { repoPath }
}

// ── Commit ─────────────────────────────────────────────────

/**
 * Stage all changes and create a commit in the sandbox's working directory.
 * Runs `git add -A && git commit -m "message"` inside the sandbox.
 *
 * @returns The commit SHA
 */
export async function autoCommit(
  sandbox: Sandbox,
  options: SandboxGitCommitOptions,
): Promise<{ sha: string }> {
  const { repoPath, message, authorName, authorEmail } = options

  // Configure git identity if provided
  if (authorName && authorEmail) {
    await sandbox.commands.run(
      `cd ${repoPath} && git config user.name "${authorName}" && git config user.email "${authorEmail}"`,
    )
  }

  // Stage everything
  const addResult = await sandbox.commands.run(
    `cd ${repoPath} && git add -A`,
  )

  if (addResult.exitCode !== 0) {
    throw new Error(`git add failed: ${addResult.stderr}`)
  }

  // Check if there's anything to commit
  const statusResult = await sandbox.commands.run(
    `cd ${repoPath} && git status --porcelain`,
  )

  if (!statusResult.stdout.trim()) {
    return { sha: "no-changes" }
  }

  // Create commit
  const commitResult = await sandbox.commands.run(
    `cd ${repoPath} && git commit -m "${escapeQuotes(message)}"`,
  )

  if (commitResult.exitCode !== 0) {
    throw new Error(`git commit failed: ${commitResult.stderr}`)
  }

  // Extract the SHA from the output (format: "[main abc1234] message")
  const shaMatch = commitResult.stdout.match(/\[[\w-]+\s+([a-f0-9]+)\]/)
  const sha = shaMatch?.[1] ?? "unknown"

  return { sha }
}

// ── Push ───────────────────────────────────────────────────

/**
 * Push commits from the sandbox to the remote repository.
 * Uses the provided token for authentication.
 *
 * After pushing, credentials are NOT stored in the remote URL
 * (E2B strips them by default — the `dangerouslyStoreCredentials` option is false).
 */
export async function pushChanges(
  sandbox: Sandbox,
  options: SandboxGitPushOptions,
): Promise<{ success: boolean }> {
  const { repoPath, branch, token, force } = options

  await sandbox.git.push(repoPath, {
    remote: "origin",
    branch,
    username: GIT_USERNAME,
    password: token,
    setUpstream: true,
    force: force ?? false,
  })

  return { success: true }
}

// ── Diff ───────────────────────────────────────────────────

export interface DiffOptions {
  repoPath: string
  /** If provided, compare against this ref (e.g. "origin/main") */
  against?: string
  /** Number of context lines (default: 3) */
  contextLines?: number
}

/**
 * Get the working tree diff or diff against a specific ref.
 *
 * @returns The diff output as a string, or empty string if no changes
 */
export async function getDiff(
  sandbox: Sandbox,
  options: DiffOptions,
): Promise<string> {
  const { repoPath, against, contextLines = 3 } = options
  const contextArg = `-U${contextLines}`

  let cmd: string

  if (against) {
    cmd = `cd ${repoPath} && git diff ${contextArg} ${against}`
  } else {
    // Working tree diff (unstaged + staged changes)
    cmd = `cd ${repoPath} && git diff ${contextArg} HEAD`
  }

  const result = await sandbox.commands.run(cmd)
  return result.stdout.trim()
}

// ── Log ────────────────────────────────────────────────────

export interface LogOptions {
  repoPath: string
  maxCount?: number
  format?: string
}

/**
 * Get recent commit log from the sandbox repo.
 *
 * @returns Array of commit entries with sha, author, date, message
 */
export async function getLog(
  sandbox: Sandbox,
  options: LogOptions,
): Promise<{ sha: string; author: string; date: string; message: string }[]> {
  const { repoPath, maxCount = 10 } = options

  // Use a delimiter-safe format: hash|author|date|subject%n
  const format = "--format=%H|%an|%ai|%s"
  const result = await sandbox.commands.run(
    `cd ${repoPath} && git log ${format} -${maxCount}`,
  )

  if (!result.stdout.trim()) {
    return []
  }

  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, author, date, ...messageParts] = line.split("|")
      return {
        sha: sha ?? "",
        author: author ?? "",
        date: date ?? "",
        message: messageParts.join("|") ?? "",
      }
    })
}

// ── Branch Operations ──────────────────────────────────────

/**
 * Checkout a specific branch in the sandbox repo.
 */
export async function checkoutBranch(
  sandbox: Sandbox,
  repoPath: string,
  branch: string,
): Promise<void> {
  // Try checking out existing branch, then create if it doesn't exist
  const result = await sandbox.commands.run(
    `cd ${repoPath} && git checkout ${branch} 2>/dev/null || git checkout -b ${branch}`,
  )

  if (result.exitCode !== 0) {
    throw new Error(`git checkout failed: ${result.stderr}`)
  }
}

/**
 * Get the current branch name in the sandbox repo.
 */
export async function getCurrentBranch(
  sandbox: Sandbox,
  repoPath: string,
): Promise<string> {
  const result = await sandbox.commands.run(
    `cd ${repoPath} && git rev-parse --abbrev-ref HEAD`,
  )
  return result.stdout.trim()
}

/**
 * List all branches (local and remote tracking) in the sandbox repo.
 */
export async function listLocalBranches(
  sandbox: Sandbox,
  repoPath: string,
): Promise<string[]> {
  const result = await sandbox.commands.run(
    `cd ${repoPath} && git branch --format="%(refname:short)"`,
  )

  if (!result.stdout.trim()) {
    return []
  }

  return result.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((b) => b.trim())
}

// ── Status ─────────────────────────────────────────────────

export interface WorkingTreeStatus {
  staged: string[]
  unstaged: string[]
  untracked: string[]
  hasChanges: boolean
}

/**
 * Get the working tree status of the sandbox repo.
 */
export async function getStatus(
  sandbox: Sandbox,
  repoPath: string,
): Promise<WorkingTreeStatus> {
  const result = await sandbox.commands.run(
    `cd ${repoPath} && git status --porcelain`,
  )

  const lines = result.stdout.trim().split("\n").filter(Boolean)
  const staged: string[] = []
  const unstaged: string[] = []
  const untracked: string[] = []

  for (const line of lines) {
    const status = line.slice(0, 2)
    const file = line.slice(3)

    // XY format: first char = index (staged), second = working tree
    if (status[0] !== " " && status[0] !== "?") {
      staged.push(file)
    }
    if (status[1] !== " " && status[1] !== "?") {
      unstaged.push(file)
    }
    if (status === "??") {
      untracked.push(file)
    }
  }

  return {
    staged,
    unstaged,
    untracked,
    hasChanges: lines.length > 0,
  }
}

// ── Identity ───────────────────────────────────────────────

/**
 * Configure git identity (user.name / user.email) for commits from the sandbox.
 * Must be called before `autoCommit` if a custom identity is desired.
 * The sandbox may already have a default identity from the E2B template.
 */
export async function configureIdentity(
  sandbox: Sandbox,
  repoPath: string,
  name: string,
  email: string,
): Promise<void> {
  await sandbox.commands.run(
    `cd ${repoPath} && git config user.name "${escapeQuotes(name)}" && git config user.email "${email}"`,
  )
}

// ── Helpers ────────────────────────────────────────────────

/** Escape double quotes for shell safety */
function escapeQuotes(value: string): string {
  return value.replace(/"/g, '\\"')
}

// ── Exported service object ────────────────────────────────

export const sandboxGit = {
  cloneRepo,
  autoCommit,
  pushChanges,
  getDiff,
  getLog,
  checkoutBranch,
  getCurrentBranch,
  listLocalBranches,
  getStatus,
  configureIdentity,
}
