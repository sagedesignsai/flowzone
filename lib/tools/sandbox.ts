/**
 * Sandbox Tools
 *
 * AI tools that operate inside an E2B sandbox environment.
 * Each tool reads the current sandbox from SandboxContext.
 */

import { tool } from "ai"
import { z } from "zod"
import { SandboxContext } from "@/lib/tools/sandbox-store"

// ── Helpers ────────────────────────────────────────────────

function requireSandbox(label: string): never {
  throw new Error(
    `Cannot run "${label}" — no development sandbox is available. ` +
      "Set E2B_API_KEY to enable sandbox features.",
  )
}

// ── Run Command ────────────────────────────────────────────

export const runCommand = tool({
  description:
    "Run a shell command in the development sandbox. " +
    "Use this to install dependencies, run builds, start dev servers, " +
    "or execute any CLI command.",
  inputSchema: z.object({
    command: z
      .string()
      .describe("The shell command to execute (e.g. `ls -la`, `npm install`)"),
    workdir: z
      .string()
      .optional()
      .describe(
        "Working directory for the command. Defaults to the repo root.",
      ),
  }),
  execute: async ({ command, workdir }) => {
    const ctx = SandboxContext.get()
    if (!ctx) requireSandbox("runCommand")
    const { sandbox, repoPath } = ctx

    const fullCommand =
      workdir
        ? `cd ${workdir} && ${command}`
        : repoPath
          ? `cd ${repoPath} && ${command}`
          : command

    const result = await sandbox.commands.run(fullCommand)

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    }
  },
})

// ── Write File ─────────────────────────────────────────────

export const writeFile = tool({
  description:
    "Write content to a file in the sandbox. " +
    "Creates parent directories if they don't exist. " +
    "Use this to create or modify source files.",
  inputSchema: z.object({
    path: z.string().describe("Absolute file path in the sandbox"),
    content: z.string().describe("File content to write"),
  }),
  execute: async ({ path, content }) => {
    const ctx = SandboxContext.get()
    if (!ctx) requireSandbox("writeFile")

    // Ensure parent directory exists
    const parentDir = path.split("/").slice(0, -1).join("/")
    if (parentDir) {
      await ctx.sandbox.commands.run(`mkdir -p ${parentDir}`)
    }

    await ctx.sandbox.files.write(path, content)

    return { success: true, path }
  },
})

// ── Read File ──────────────────────────────────────────────

export const readFile = tool({
  description:
    "Read a file from the sandbox and return its contents. " +
    "Use this to examine source files, configs, or logs.",
  inputSchema: z.object({
    path: z.string().describe("Absolute file path in the sandbox"),
  }),
  execute: async ({ path }) => {
    const ctx = SandboxContext.get()
    if (!ctx) requireSandbox("readFile")

    const content = await ctx.sandbox.files.read(path)
    return { content, path }
  },
})

// ── List Files ─────────────────────────────────────────────

export const listFiles = tool({
  description:
    "List files and directories in a sandbox directory. " +
    "Use this to explore the project structure.",
  inputSchema: z.object({
    path: z
      .string()
      .describe("Absolute directory path in the sandbox")
      .default("/home/user"),
    recursive: z
      .boolean()
      .optional()
      .describe("List files recursively"),
  }),
  execute: async ({ path, recursive }) => {
    const ctx = SandboxContext.get()
    if (!ctx) requireSandbox("listFiles")

    if (recursive) {
      const result = await ctx.sandbox.commands.run(
        `find ${path} -type f -o -type d | head -200`,
      )
      return {
        entries: result.stdout
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((name) => ({ name, type: "entry" as const })),
      }
    }

    const entries = await ctx.sandbox.files.list(path)
    return {
      entries: entries.map((e) => ({
        name: e.name,
        type: e.type === "dir" ? ("directory" as const) : ("file" as const),
      })),
    }
  },
})
