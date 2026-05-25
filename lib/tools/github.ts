/**
 * GitHub Agent Tools
 *
 * AI tools for GitHub operations (issues, PRs, workflows, branches).
 * These tools read the sandbox context to resolve the current repo
 * and authentication, then delegate to the lib/github module.
 *
 * Each tool follows the same pattern as lib/tools/git.ts:
 *   1. Read SandboxContext for sandbox/repo info
 *   2. Fall back to DB lookup via chatId if needed
 *   3. Delegate to the appropriate lib/github/ module
 */

import { tool } from "ai"
import { z } from "zod"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import { prisma } from "@/lib/prisma"
import {
  createPullRequest as createGithubPR,
  listPullRequests as listGithubPRs,
} from "@/lib/github/pulls"
import {
  createIssue as createGithubIssue,
  listIssues as listGithubIssues,
} from "@/lib/github/issues"
import { dispatchWorkflow as dispatchGithubWorkflow } from "@/lib/github/workflows"
import {
  createBranch as createGithubBranch,
  deleteBranch as deleteGithubBranch,
} from "@/lib/github/branches"

// ── Helper ─────────────────────────────────────────────────

/**
 * Resolve repo context from the sandbox or database.
 * Returns owner, repo, installationId for the current chat.
 */
async function resolveRepoContext(): Promise<{
  owner: string
  repo: string
  installationId: number
  branch?: string
} | null> {
  const ctx = SandboxContext.get()

  // Try DB lookup via chatId
  if (ctx?.chatId) {
    const chat = await prisma.chat.findUnique({
      where: { id: ctx.chatId },
      include: { gitRepo: true },
    })

    if (chat?.gitRepo) {
      return {
        owner: chat.gitRepo.owner,
        repo: chat.gitRepo.name,
        installationId: Number(chat.gitRepo.installationId),
        branch: chat.gitBranch ?? undefined,
      }
    }
  }

  return null
}

// ── Create Pull Request ────────────────────────────────────

export const createPullRequest = tool({
  description:
    "Create a pull request from the current chat branch to the base branch. " +
    "Use this when the user wants to open a PR with their changes.",
  inputSchema: z.object({
    title: z.string().describe("Pull request title"),
    body: z.string().optional().describe("Pull request description"),
    base: z
      .string()
      .optional()
      .describe("Target branch (defaults to repo default branch)"),
    draft: z
      .boolean()
      .optional()
      .describe("Create as draft PR (default: false)"),
  }),
  execute: async ({ title, body, base, draft }) => {
    const repo = await resolveRepoContext()

    if (!repo) {
      return {
        success: false,
        error: "No repository is linked to this chat. Import a repo first.",
      }
    }

    const head = repo.branch
    if (!head) {
      return {
        success: false,
        error: "No working branch found. Import a repo first.",
      }
    }

    const pr = await createGithubPR({
      owner: repo.owner,
      repo: repo.repo,
      installationId: repo.installationId,
      title,
      head,
      base: base ?? "main",
      body,
      draft,
    })

    return {
      success: true,
      prNumber: pr.prNumber,
      prUrl: pr.prUrl,
      title: pr.title,
      state: pr.state,
    }
  },
})

// ── List Pull Requests ─────────────────────────────────────

export const listPullRequests = tool({
  description:
    "List pull requests for the current repository. " +
    "Use this to see open, closed, or all PRs.",
  inputSchema: z.object({
    state: z
      .enum(["open", "closed", "all"])
      .optional()
      .describe("Filter by state (default: open)"),
  }),
  execute: async ({ state }) => {
    const repo = await resolveRepoContext()

    if (!repo) {
      return {
        success: false,
        error: "No repository is linked to this chat.",
      }
    }

    const prs = await listGithubPRs({
      owner: repo.owner,
      repo: repo.repo,
      installationId: repo.installationId,
      state: state ?? "open",
    })

    return { success: true, pullRequests: prs }
  },
})

// ── Create Issue ───────────────────────────────────────────

export const createIssue = tool({
  description:
    "Create an issue on the current repository. " +
    "Use this when the user wants to file a bug or feature request.",
  inputSchema: z.object({
    title: z.string().describe("Issue title"),
    body: z.string().optional().describe("Issue description"),
    labels: z
      .array(z.string())
      .optional()
      .describe("Labels to apply (e.g. ['bug', 'enhancement'])"),
  }),
  execute: async ({ title, body, labels }) => {
    const repo = await resolveRepoContext()

    if (!repo) {
      return {
        success: false,
        error: "No repository is linked to this chat.",
      }
    }

    const issue = await createGithubIssue({
      owner: repo.owner,
      repo: repo.repo,
      installationId: repo.installationId,
      title,
      body,
      labels,
    })

    return {
      success: true,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.url,
    }
  },
})

// ── List Issues ────────────────────────────────────────────

export const listIssues = tool({
  description:
    "List issues for the current repository. " +
    "Use this to see open, closed, or all issues.",
  inputSchema: z.object({
    state: z
      .enum(["open", "closed", "all"])
      .optional()
      .describe("Filter by state (default: open)"),
  }),
  execute: async ({ state }) => {
    const repo = await resolveRepoContext()

    if (!repo) {
      return {
        success: false,
        error: "No repository is linked to this chat.",
      }
    }

    const issues = await listGithubIssues({
      owner: repo.owner,
      repo: repo.repo,
      installationId: repo.installationId,
      state: state ?? "open",
    })

    return { success: true, issues }
  },
})

// ── Dispatch Workflow ──────────────────────────────────────

export const dispatchWorkflow = tool({
  description:
    "Trigger a GitHub Actions workflow in the current repository. " +
    "Use this to run CI/CD pipelines, deployments, or automated tasks.",
  inputSchema: z.object({
    workflow_id: z
      .string()
      .describe("Workflow ID or filename (e.g. 'deploy.yml' or a numeric ID)"),
    ref: z
      .string()
      .optional()
      .describe("Branch to run the workflow on (defaults to current branch)"),
    inputs: z
      .record(z.string())
      .optional()
      .describe("Workflow inputs (for workflow_dispatch inputs)"),
  }),
  execute: async ({ workflow_id, ref, inputs }) => {
    const repo = await resolveRepoContext()

    if (!repo) {
      return {
        success: false,
        error: "No repository is linked to this chat.",
      }
    }

    const result = await dispatchGithubWorkflow({
      owner: repo.owner,
      repo: repo.repo,
      installationId: repo.installationId,
      workflow_id,
      ref: ref ?? repo.branch ?? "main",
      inputs,
    })

    return {
      success: true,
      dispatched: result.dispatched,
      workflow_id: result.workflow_id,
      ref: result.ref,
    }
  },
})

// ── Create Branch ──────────────────────────────────────────

export const createBranch = tool({
  description:
    "Create a new branch in the current repository. " +
    "Use this when the user wants to start working from a new branch.",
  inputSchema: z.object({
    baseBranch: z.string().describe("Source branch to branch from"),
    newBranch: z.string().describe("Name for the new branch"),
  }),
  execute: async ({ baseBranch, newBranch }) => {
    const repo = await resolveRepoContext()

    if (!repo) {
      return {
        success: false,
        error: "No repository is linked to this chat.",
      }
    }

    const branch = await createGithubBranch({
      owner: repo.owner,
      repo: repo.repo,
      baseBranch,
      newBranch,
      installationId: repo.installationId,
    })

    return {
      success: true,
      name: branch.name,
      sha: branch.sha,
    }
  },
})

// ── Delete Branch ──────────────────────────────────────────

export const deleteBranch = tool({
  description:
    "Delete a branch from the current repository. " +
    "Use this when the user wants to clean up merged or stale branches.",
  inputSchema: z.object({
    branch: z.string().describe("Name of the branch to delete"),
  }),
  execute: async ({ branch }) => {
    const repo = await resolveRepoContext()

    if (!repo) {
      return {
        success: false,
        error: "No repository is linked to this chat.",
      }
    }

    await deleteGithubBranch({
      owner: repo.owner,
      repo: repo.repo,
      branch,
      installationId: repo.installationId,
    })

    return {
      success: true,
      message: `Branch "${branch}" deleted successfully.`,
    }
  },
})
