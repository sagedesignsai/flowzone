/**
 * Git Tools
 *
 * AI tools for git operations in the E2B sandbox.
 * Reads sandbox context from SandboxContext for the sandbox reference,
 * repo path, and auth token.
 */

import { tool } from "ai"
import { z } from "zod"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import { sandboxGit } from "@/lib/sandbox-git"

// ── Helpers ────────────────────────────────────────────────

function requireSandbox(label: string): never {
  throw new Error(
    `Cannot run "${label}" — no development sandbox is available. ` +
      "Set E2B_API_KEY to enable sandbox features.",
  )
}

// ── Commit and Push ────────────────────────────────────────

export const commitAndPush = tool({
  description:
    "Stage all changes, commit with a message, and push to the remote branch. " +
    "Use this after making code changes to save them to GitHub.",
  inputSchema: z.object({
    message: z.string().describe("Commit message describing the changes"),
  }),
  execute: async ({ message }) => {
    const ctx = SandboxContext.get()
    if (!ctx) requireSandbox("commitAndPush")
    const { sandbox, repoPath, branch, token } = ctx

    if (!repoPath) {
      return {
        success: false,
        error: "No repository is cloned in this sandbox. Import a repo first.",
      }
    }

    // 1. Configure git identity (Flowzone bot)
    await sandboxGit.configureIdentity(
      sandbox,
      repoPath,
      "Flowzone Bot",
      "bot@flowzone.dev",
    )

    // 2. Stage and commit
    const { sha } = await sandboxGit.autoCommit(sandbox, {
      repoPath,
      message,
    })

    if (sha === "no-changes") {
      return { success: true, sha, message: "No changes to commit." }
    }

    // 3. Push if we have a branch and token
    if (branch && token) {
      await sandboxGit.pushChanges(sandbox, { repoPath, branch, token })
    }

    return {
      success: true,
      sha,
      message: `Committed${branch && token ? " and pushed" : ""} successfully.`,
    }
  },
})

// ── Get Diff ───────────────────────────────────────────────

export const getDiff = tool({
  description:
    "Show the working tree diff (unstaged + staged changes). " +
    "Use this to review what has been changed before committing.",
  inputSchema: z.object({
    against: z
      .string()
      .optional()
      .describe(
        "Optional ref to compare against (e.g. 'origin/main'). Defaults to HEAD.",
      ),
    contextLines: z
      .number()
      .optional()
      .describe("Number of context lines (default: 3)")
      .default(3),
  }),
  execute: async ({ against, contextLines }) => {
    const ctx = SandboxContext.get()
    if (!ctx) requireSandbox("getDiff")
    const { sandbox, repoPath } = ctx

    if (!repoPath) {
      return { error: "No repository cloned in this sandbox.", diff: "" }
    }

    const diff = await sandboxGit.getDiff(sandbox, {
      repoPath,
      against,
      contextLines,
    })

    return {
      diff,
      hasChanges: diff.length > 0,
    }
  },
})

// ── Get Status ─────────────────────────────────────────────

export const getStatus = tool({
  description:
    "Show the git working tree status. " +
    "Returns staged, unstaged, and untracked files. " +
    "Use this to check the current state of the repository.",
  inputSchema: z.object({}),
  execute: async () => {
    const ctx = SandboxContext.get()
    if (!ctx) requireSandbox("getStatus")
    const { sandbox, repoPath } = ctx

    if (!repoPath) {
      return {
        error: "No repository cloned in this sandbox.",
        hasChanges: false,
        staged: [],
        unstaged: [],
        untracked: [],
      }
    }

    const status = await sandboxGit.getStatus(sandbox, repoPath)
    return status
  },
})

// ── Get Commit Log ─────────────────────────────────────────

export const getLog = tool({
  description:
    "Show recent commit history. " +
    "Use this to see what has been committed recently.",
  inputSchema: z.object({
    maxCount: z
      .number()
      .optional()
      .describe("Maximum number of commits to show (default: 10)")
      .default(10),
  }),
  execute: async ({ maxCount }) => {
    const ctx = SandboxContext.get()
    if (!ctx) requireSandbox("getLog")
    const { sandbox, repoPath } = ctx

    if (!repoPath) {
      return { error: "No repository cloned in this sandbox.", commits: [] }
    }

    const commits = await sandboxGit.getLog(sandbox, { repoPath, maxCount })
    return { commits }
  },
})
