/**
 * OpenCode Tool
 *
 * Delegates complex coding tasks to the OpenCode CLI running inside
 * the E2B desktop sandbox. OpenCode is an AI-powered coding agent
 * that operates inside the sandbox terminal.
 *
 * OpenCode CLI usage: opencode run "<prompt>"
 */

import { tool } from "ai"
import { z } from "zod"
import {
  DesktopSandboxContext,
  requireDesktop,
} from "@/lib/tools/desktop/sandbox-context"

// ── Run OpenCode Task ───────────────────────────────────────

export const runOpenCodeTask = tool({
  description:
    "[LEGACY FALLBACK] Use submitToOpenCode instead. " +
    "This tool runs opencode run in a desktop shell (blocking, no streaming). " +
    "Only use if submitToOpenCode is unavailable.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "Detailed instructions for what code to write, modify, refactor, or debug. Be specific about file paths, frameworks, and desired behavior."
      ),
    workdir: z
      .string()
      .optional()
      .describe(
        "Working directory to run OpenCode in (e.g. '/home/user/project')"
      ),
  }),
  execute: async ({ prompt, workdir }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("runOpenCodeTask")
    const { desktop } = ctx

    const escaped = prompt.replace(/"/g, '\\"').replace(/`/g, "\\`")
    const cmd = workdir
      ? `cd ${workdir} && opencode run "${escaped}"`
      : `opencode run "${escaped}"`

    const result = await desktop.commands.run(cmd, { timeoutMs: 300000 })

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      prompt,
    }
  },
})
