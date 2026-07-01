/**
 * PTY Terminal Tools
 *
 * AI tools for interactive terminal (PTY) sessions inside an E2B sandbox.
 * Designed for use with ToolLoopAgent — the agent can create shells,
 * send input, read output, wait for patterns, and resize/kill terminals.
 *
 * Unlike sandbox.commands.run() which executes a command and returns
 * after completion, PTY provides:
 *   - Real-time streaming output via onData
 *   - Bidirectional input (send while running)
 *   - Interactive shell (bash with TERM=xterm-256color)
 *   - Session persistence (disconnect/reconnect)
 *
 * Each tool reads the sandbox from SandboxContext and manages
 * PTY sessions via the PtyManager singleton.
 *
 * Auto-resolution: When sessionId is omitted, tools resolve the PTY
 * session from the chatId in SandboxContext via the pty-store.
 * This allows the agent to interact with a pre-existing PTY
 * (e.g. one created by the init flow with opencode already running)
 * without needing to call createPtyShell first.
 */

import { tool } from "ai"
import { z } from "zod"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import * as ptyManager from "@/lib/pty/pty-manager"
import type { PtyTimeoutError } from "@/lib/pty/pty-manager"
import {
  getPtyChatSession,
  registerPtyChatSession,
  unregisterPtyChatSession,
} from "@/lib/pty/pty-store"
import { logger } from "@/lib/logger"

// ── Helpers ───────────────────────────────────────────────

function requireSandbox(label: string) {
  const ctx = SandboxContext.get()
  if (!ctx?.sandbox) {
    throw new Error(
      `Cannot run "${label}" — no development sandbox is available. Set E2B_API_KEY.`,
    )
  }
  return ctx
}

/**
 * Resolve a PTY session ID, falling back to the chat-scoped session
 * when no explicit sessionId is provided.
 */
function resolveSessionId(
  sessionId: string | undefined,
): { sessionId: string; pid: number } {
  // Explicit sessionId provided — use it directly
  if (sessionId) {
    const session = ptyManager.getPtySession(sessionId)
    if (!session) {
      throw new Error(
        `No PTY session found for "${sessionId}". Create one with createPtyShell first.`,
      )
    }
    return { sessionId, pid: session.pid }
  }

  // No sessionId — resolve from chatId via pty-store
  const ctx = SandboxContext.get()
  if (!ctx?.chatId) {
    throw new Error(
      'No sessionId provided and no chat context available. Provide a sessionId or ensure createPtyShell was called first.',
    )
  }

  const ptySession = getPtyChatSession(ctx.chatId)
  if (!ptySession) {
    throw new Error(
      `No PTY session found for chat "${ctx.chatId}". Create one with createPtyShell first.`,
    )
  }

  const session = ptyManager.getPtySession(ptySession.sandboxId)
  if (!session) {
    throw new Error(
      `PTY session for sandbox "${ptySession.sandboxId}" is no longer active. Create a new one with createPtyShell.`,
    )
  }

  return { sessionId: ptySession.sandboxId, pid: session.pid }
}

// ── Create PTY Shell ──────────────────────────────────────

export const createPtyShell = tool({
  description: [
    "Create an interactive PTY (pseudo-terminal) shell session inside the sandbox.",
    "This starts a bash shell with full terminal support (ANSI, colors, key sequences).",
    "",
    "Use this when you need to:",
    "- Run interactive CLI applications (like opencode TUI)",
    "- Execute commands that require real-time input/output",
    "- Start a long-running process and interact with it",
    "- Use terminal-based editors, pagers, or menus",
    "",
    "If a PTY session already exists for this chat, it will be reused instead of creating a new one.",
    "",
    "Returns a sessionId — pass this to other PTY tools (sendPtyInput, waitForPtyOutput, etc.).",
    "If the session was reused, reused=true is returned.",
  ].join("\n"),
  inputSchema: z.object({
    cols: z
      .number()
      .optional()
      .default(120)
      .describe("Terminal width in characters (default: 120)"),
    rows: z
      .number()
      .optional()
      .default(40)
      .describe("Terminal height in characters (default: 40)"),
    cwd: z
      .string()
      .optional()
      .describe("Working directory (default: sandbox home)"),
  }),
  execute: async ({ cols, rows, cwd }) => {
    const ctx = requireSandbox("createPtyShell")
    const chatId = ctx.chatId
    const sandboxId = ctx.sandbox.sandboxId

    // Check if a PTY session already exists for this sandbox
    const existingSession = ptyManager.getPtySession(sandboxId)
    if (existingSession && !existingSession.destroyed) {
      // Ensure it's registered in the chat store for SSE streaming
      if (chatId) {
        registerPtyChatSession(chatId, sandboxId, existingSession.pid)
      }
      logger.debug("Reusing existing PTY session", {
        sandboxId,
        pid: existingSession.pid,
        chatId,
      })
      return {
        sessionId: sandboxId,
        pid: existingSession.pid,
        reused: true as const,
      }
    }

    // Create a new PTY session
    const sessionId = await ptyManager.createPtySession(ctx.sandbox, {
      cols,
      rows,
      cwd,
      timeoutMs: 0,
    })

    const session = ptyManager.getPtySession(sessionId)
    if (!session) {
      throw new Error("Failed to create PTY session")
    }

    // Register in the chat store for SSE terminal streaming
    if (chatId) {
      registerPtyChatSession(chatId, ctx.sandbox.sandboxId, session.pid)
      logger.debug("Registered PTY session for chat", {
        chatId,
        sandboxId: ctx.sandbox.sandboxId,
        pid: session.pid,
      })
    }

    return {
      sessionId,
      pid: session.pid,
      reused: false as const,
    }
  },
})

// ── Send Input ────────────────────────────────────────────

export const sendPtyInput = tool({
  description: [
    "Send text input to an active PTY terminal session.",
    "The text is typed into the terminal — like a user typing on a keyboard.",
    "",
    "IMPORTANT:",
    "- End commands with \\n (newline) to \"press Enter\"",
    "- For multi-line input, include \\n between lines",
    "- Input is sent as UTF-8 text",
    "- The terminal processes this exactly as if a user typed it",
    "",
    "Use cases:",
    '- Type a command: `"ls -la\\n"`',
    '- Answer a prompt: `"yes\\n"`',
    '- Send Ctrl+C: `"\\x03"`',
    "",
    "sessionId is optional — if omitted, the active PTY session for this chat is used automatically.",
  ].join("\n"),
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("The session ID returned by createPtyShell (optional — auto-resolved from chat if omitted)"),
    text: z
      .string()
      .describe("Text to send to the terminal. End commands with \\n (newline) to execute."),
  }),
  execute: async ({ sessionId, text }) => {
    const ctx = requireSandbox("sendPtyInput")
    const { pid } = resolveSessionId(sessionId)

    const encoder = new TextEncoder()
    await ctx.sandbox.pty.sendInput(pid, encoder.encode(text))

    return { ok: true as const, pid, sent: text.length }
  },
})

// ── Read Output ───────────────────────────────────────────

export const readPtyOutput = tool({
  description: [
    "Read the accumulated output from a PTY terminal session.",
    "This returns ALL output since the session was created or last cleared.",
    "",
    "Use this to:",
    "- See what a command printed",
    "- Check if a process is still running or produced errors",
    "- Inspect terminal state without waiting for new output",
    "",
    "This is non-blocking — returns immediately with whatever is in the buffer.",
    "For streaming output, use waitForPtyOutput instead.",
    "",
    "sessionId is optional — if omitted, the active PTY session for this chat is used automatically.",
  ].join("\n"),
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("The session ID returned by createPtyShell (optional — auto-resolved from chat if omitted)"),
    clear: z
      .boolean()
      .optional()
      .default(false)
      .describe("Clear the output buffer after reading (default: false)"),
  }),
  execute: async ({ sessionId, clear }) => {
    const resolved = resolveSessionId(sessionId)
    const output = ptyManager.readPtyOutput(resolved.sessionId)
    if (clear) {
      ptyManager.clearPtyOutput(resolved.sessionId)
    }

    return {
      output,
      length: output.length,
      cleared: clear,
    }
  },
})

// ── Wait for Output (streaming) ───────────────────────────

export const waitForPtyOutput = tool({
  description: [
    "Wait for a specific text pattern to appear in the PTY terminal output.",
    "STREAMS new output to the user in real-time as it arrives.",
    "",
    "Use this AFTER sendPtyInput to wait for a command to finish or",
    "a specific prompt to appear. For example:",
    "- Wait for a shell prompt after a command: '$', '#', or '❯'",
    "- Wait for opencode to finish: 'Task complete' or 'Summary'",
    "- Wait for a confirmation prompt: '(y/n)' or '[Y/n]'",
    "- Wait for a specific error message",
    "",
    "TIPS:",
    "- Use simple substring patterns (not regex)",
    "- Set timeout based on expected task duration",
    "- The output is streamed to the user — they see terminal output live",
    "- Returns everything in the buffer when the pattern matches",
    "",
    "RETURN VALUE:",
    "  {",
    '    "output": "Full terminal output accumulated so far",',
    '    "delta": "The latest chunk of new output",',
    '    "pattern": "The pattern you searched for",',
    '    "matched": true/false  — whether the pattern was found,',
    '    "error": "Error message if timed out (only on timeout)"',
    "  }",
    "",
    "Check matched=true to confirm the pattern appeared.",
    "If matched=false and there's an error, the terminal timed out waiting —",
    "read the output to decide next steps.",
    "",
    "If the pattern is not found within the timeout, returns an error",
    "with whatever output was captured.",
    "",
    "sessionId is optional — if omitted, the active PTY session for this chat is used automatically.",
  ].join("\n"),
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("The session ID returned by createPtyShell (optional — auto-resolved from chat if omitted)"),
    pattern: z
      .string()
      .describe("Substring to wait for in the terminal output (e.g. '$', 'ready', 'complete')"),
    timeout: z
      .number()
      .optional()
      .default(120_000)
      .describe("Max time to wait in milliseconds (default: 120000 = 2 min)"),
  }),
  execute: async function* ({ sessionId, pattern, timeout }) {
    const resolved = resolveSessionId(sessionId)

    try {
      for await (const { delta, fullOutput } of ptyManager.waitForPtyPattern(
        resolved.sessionId,
        { pattern, timeout, interval: 100 },
      )) {
        // AI SDK's executeTool wraps yields as preliminary results.
        // The for await...of only captures yields, NOT return values.
        // So we yield accumulated output each tick so the final
        // result (last yield) contains the complete terminal output.
        yield {
          delta,
          output: fullOutput,
          pattern,
          matched: false as const,
        }
      }

      // Pattern matched — the for await...of exits when
      // waitForPtyPattern returns. Yield one more time with
      // matched: true so the agent knows the tool succeeded.
      yield {
        output: ptyManager.readPtyOutput(resolved.sessionId),
        pattern,
        matched: true as const,
      }
    } catch (error) {
      const ptyErr = error as PtyTimeoutError
      yield {
        output: ptyErr.output ?? ptyManager.readPtyOutput(resolved.sessionId),
        pattern,
        matched: false as const,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  },
})

// ── Resize Terminal ───────────────────────────────────────

export const resizePty = tool({
  description: [
    "Resize the PTY terminal dimensions (columns × rows).",
    "Use this when the terminal output is wrapping oddly or the",
    "application requests a specific size.",
    "",
    "sessionId is optional — if omitted, the active PTY session for this chat is used automatically.",
  ].join("\n"),
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("The session ID returned by createPtyShell (optional — auto-resolved from chat if omitted)"),
    cols: z
      .number()
      .optional()
      .default(120)
      .describe("New width in characters (default: 120)"),
    rows: z
      .number()
      .optional()
      .default(40)
      .describe("New height in characters (default: 40)"),
  }),
  execute: async ({ sessionId, cols, rows }) => {
    const ctx = requireSandbox("resizePty")
    const { pid } = resolveSessionId(sessionId)

    await ctx.sandbox.pty.resize(pid, { cols, rows })

    return { ok: true as const, cols, rows }
  },
})

// ── Kill PTY ──────────────────────────────────────────────

export const killPty = tool({
  description: [
    "Kill and clean up a PTY terminal session.",
    "Use this when you're done with the terminal or need to reset it.",
    "After killing, create a new session with createPtyShell if needed.",
    "",
    "sessionId is optional — if omitted, the active PTY session for this chat is used automatically.",
  ].join("\n"),
  inputSchema: z.object({
    sessionId: z
      .string()
      .optional()
      .describe("The session ID returned by createPtyShell (optional — auto-resolved from chat if omitted)"),
  }),
  execute: async ({ sessionId }) => {
    const resolved = resolveSessionId(sessionId)

    await ptyManager.destroyPtySession(resolved.sessionId)

    // Also unregister from chat store
    const ctx = SandboxContext.get()
    if (ctx?.chatId) {
      unregisterPtyChatSession(ctx.chatId)
    }

    return { ok: true as const }
  },
})
