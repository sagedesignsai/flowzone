/**
 * Desktop Git Tools
 *
 * Git operations for the desktop sandbox.
 * Uses DesktopSandboxContext to access the desktop sandbox
 * and runs git commands via sandbox.commands.run().
 *
 * Unlike the primary agent's git tools (lib/tools/git.ts), these
 * work with @e2b/desktop Sandbox instances and are designed for
 * the OpenCode desktop workflow: clone repo → OpenCode codes →
 * plugin pushes → agent verifies.
 */

import { tool } from "ai"
import { z } from "zod"
import { DesktopSandboxContext } from "@/lib/tools/desktop/sandbox-context"
import { prisma } from "@/lib/prisma"
import { getInstallationToken } from "@/lib/github"

// ── Helpers ────────────────────────────────────────────────

function requireDesktop(label: string): never {
  throw new Error(
    `Cannot run "${label}" — no desktop sandbox context is active.`,
  )
}

/**
 * Escape double quotes for shell safety in git commands
 */
function esc(value: string): string {
  return value.replace(/"/g, '\\"')
}

// ── Clone Repo ─────────────────────────────────────────────

export const cloneRepo = tool({
  description:
    "Clone the chat's associated GitHub repository into the desktop sandbox. " +
    "Creates a flowzone/{chatId} branch for isolated work. " +
    "Sets up git credentials so subsequent operations (push, pull) work automatically. " +
    "Call this FIRST before using OpenCode on a project.",
  inputSchema: z.object({
    path: z
      .string()
      .optional()
      .describe("Custom repo path (default: /home/user/project)")
      .default("/home/user/project"),
  }),
  execute: async ({ path }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("cloneRepo")
    const { desktop, chatId } = ctx

    if (!chatId) {
      return {
        success: false,
        error: "No chat ID in context. Cannot resolve repository.",
      }
    }

    // Look up the chat's GitRepo
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { gitRepo: true },
    })

    if (!chat?.gitRepo) {
      return {
        success: false,
        error:
          "No GitHub repository is linked to this chat. " +
          "Import a repo first via the project settings.",
      }
    }

    const { gitRepo, gitBranch } = chat
    const repoUrl = `https://github.com/${gitRepo.fullName}.git`
    const branch = gitBranch ?? `flowzone/${chatId}`
    const installationId = Number(gitRepo.installationId)

    // Get a fresh installation token
    let token: string
    try {
      const result = await getInstallationToken(installationId)
      token = result.token
    } catch {
      return {
        success: false,
        error: "Failed to get GitHub installation token.",
      }
    }

    try {
      // 1. Clone the repo
      await desktop.git.clone(repoUrl, {
        path,
        username: "x-access-token",
        password: token,
      })

      // 2. Checkout (or create) the working branch
      const checkoutResult = await desktop.commands.run(
        `cd ${path} && git checkout ${branch} 2>/dev/null || git checkout -b ${branch}`,
      )
      if (checkoutResult.exitCode !== 0) {
        throw new Error(`git checkout failed: ${checkoutResult.stderr}`)
      }

      // 3. Configure git identity
      await desktop.commands.run(
        `cd ${path} && git config user.name "Flowzone Bot" && git config user.email "bot@flowzone.dev"`,
      )

      // 4. Store credentials so subsequent push/pull works
      await desktop.git.dangerouslyAuthenticate({
        username: "x-access-token",
        password: token,
      })

      return {
        success: true,
        repoPath: path,
        branch,
        owner: gitRepo.owner,
        repo: gitRepo.name,
        fullName: gitRepo.fullName,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Clone failed"
      return { success: false, error: msg }
    }
  },
})

// ── Get Git Status ─────────────────────────────────────────

export const getGitStatus = tool({
  description:
    "Show the git working tree status. " +
    "Returns staged, unstaged, and untracked files. " +
    "Use this after OpenCode finishes coding to see what changed.",
  inputSchema: z.object({
    repoPath: z
      .string()
      .optional()
      .describe("Path to the repo (default: /home/user/project)")
      .default("/home/user/project"),
  }),
  execute: async ({ repoPath }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("getGitStatus")

    const result = await ctx.desktop.commands.run(
      `cd ${repoPath} && git status --porcelain`,
    )

    if (result.exitCode !== 0) {
      return { error: result.stderr, hasChanges: false }
    }

    const lines = result.stdout.trim().split("\n").filter(Boolean)
    const staged: string[] = []
    const unstaged: string[] = []
    const untracked: string[] = []

    for (const line of lines) {
      const status = line.slice(0, 2)
      const file = line.slice(3)
      if (status[0] !== " " && status[0] !== "?") staged.push(file)
      if (status[1] !== " " && status[1] !== "?") unstaged.push(file)
      if (status === "??") untracked.push(file)
    }

    // Get current branch name
    const branchResult = await ctx.desktop.commands.run(
      `cd ${repoPath} && git rev-parse --abbrev-ref HEAD`,
    )
    const currentBranch = branchResult.stdout.trim()

    return {
      currentBranch,
      staged,
      unstaged,
      untracked,
      hasChanges: lines.length > 0,
    }
  },
})

// ── Get Git Diff ───────────────────────────────────────────

export const getGitDiff = tool({
  description:
    "Show the working tree diff (unstaged + staged changes vs HEAD). " +
    "Use this to review what OpenCode changed before pushing.",
  inputSchema: z.object({
    repoPath: z
      .string()
      .optional()
      .describe("Path to the repo (default: /home/user/project)")
      .default("/home/user/project"),
    contextLines: z
      .number()
      .optional()
      .describe("Number of context lines (default: 3)")
      .default(3),
  }),
  execute: async ({ repoPath, contextLines }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("getGitDiff")

    const result = await ctx.desktop.commands.run(
      `cd ${repoPath} && git diff -U${contextLines} HEAD`,
    )

    return {
      diff: result.stdout.trim(),
      hasChanges: result.stdout.trim().length > 0,
    }
  },
})

// ── Get Git Log ────────────────────────────────────────────

export const getGitLog = tool({
  description:
    "Show recent commit history for the current branch. " +
    "Use this to see what commits have been made.",
  inputSchema: z.object({
    repoPath: z
      .string()
      .optional()
      .describe("Path to the repo (default: /home/user/project)")
      .default("/home/user/project"),
    maxCount: z
      .number()
      .optional()
      .describe("Maximum commits to show (default: 10)")
      .default(10),
  }),
  execute: async ({ repoPath, maxCount }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("getGitLog")

    const result = await ctx.desktop.commands.run(
      `cd ${repoPath} && git log --format="%H|%an|%ai|%s" -${maxCount}`,
    )

    if (!result.stdout.trim()) {
      return { commits: [] }
    }

    const commits = result.stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, author, date, ...msgParts] = line.split("|")
        return {
          sha: sha ?? "",
          author: author ?? "",
          date: date ?? "",
          message: msgParts.join("|") ?? "",
        }
      })

    return { commits }
  },
})
