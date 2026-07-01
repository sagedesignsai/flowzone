/**
 * OpenCode HTTP Tools for PTY Agent
 *
 * AI tools that interact with the opencode TUI via its HTTP API instead of
 * sending keystrokes through the PTY. This is more reliable than ANSI
 * text-pattern matching on PTY output.
 *
 * Architecture:
 *   The opencode TUI starts an HTTP server alongside the terminal UI.
 *   We connect to it via sandbox.getHost() (public HTTPS tunnel) using
 *   the @opencode-ai/sdk/v2 client.
 *
 *   The client is created once during init and cached in sandbox-cache.ts
 *   (keyed by sandboxId). These tools retrieve it from cache, or create
 *   a new one as fallback if the cache miss occurs.
 *
 * Tool summary:
 *   opencodeReady        — health check
 *   opencodeAppendPrompt — inject text into TUI prompt input
 *   opencodeSubmitPrompt — submit the TUI prompt (like pressing Enter)
 *   opencodeWait         — subscribe to SSE events, stream progress, detect completion
 */

import { tool } from "ai"
import { z } from "zod"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import { getCachedManager, setCachedManager } from "@/lib/sandbox-cache"
import {
  unwrapOpenCodeEvent,
  isOpenCodeSessionComplete,
  getOpenCodeEventSessionId,
} from "@/lib/opencode-sandbox/event-converter"
import { logger } from "@/lib/logger"

const OPENCODE_PORT = 4096
const OPENCODE_PASSWORD = "opencode-fz-local"
const HEALTH_CHECK_RETRIES = 10
const HEALTH_CHECK_INTERVAL_MS = 1000

// ── Helpers ──────────────────────────────────────────────────

function requireSandbox(label: string) {
  const ctx = SandboxContext.get()
  if (!ctx?.sandbox) {
    throw new Error(
      `Cannot run "${label}" — no development sandbox is available. Set E2B_API_KEY.`,
    )
  }
  return ctx
}

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`opencode:${OPENCODE_PASSWORD}`).toString("base64")}`
}

/**
 * Get (or create) the OpenCode SDK client for the current sandbox.
 *
 * First checks the sandbox-cache (populated by the init route).
 * If not found, performs a health check and creates a new client
 * as a fallback — this covers edge cases where init completed but
 * caching failed, or the sandbox was reconnected.
 */
async function getOrCreateClient() {
  const ctx = requireSandbox("opencode tool")
  const sandboxId = ctx.sandbox.sandboxId

  // Check cache first (populated by init route)
  const cached = getCachedManager(sandboxId)
  if (cached) return cached.client

  // Fallback: health check via curl inside sandbox
  logger.info("OpenCode client not cached — creating fallback", { sandboxId })
  const healthCmd = [
    "curl",
    "-s",
    "--max-time", "5",
    "-o", "/dev/null",
    "-w", '"%{http_code}"',
    "-u", `opencode:${OPENCODE_PASSWORD}`,
    `http://localhost:${OPENCODE_PORT}/global/health`,
    "|| true",
  ].join(" ")

  let ready = false
  for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
    try {
      const result = await ctx.sandbox.commands.run(healthCmd)
      if (result.stdout.trim() === "200") {
        ready = true
        break
      }
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, HEALTH_CHECK_INTERVAL_MS))
  }

  if (!ready) {
    throw new Error(
      "OpenCode server is not ready. Ensure the sandbox has opencode running " +
        "with `opencode --port 4096`.",
    )
  }

  const authHeader = getAuthHeader()
  const host = ctx.sandbox.getHost(OPENCODE_PORT)
  const baseUrl = `https://${host}`

  const { createOpencodeClient } = await import("@opencode-ai/sdk/v2")
  const client = createOpencodeClient({
    baseUrl,
    headers: { Authorization: authHeader },
  })

  // Cache for future use
  setCachedManager(sandboxId, {
    client,
    baseUrl,
    sandboxId,
    stop: async () => {},
  })

  logger.info("Fallback OpenCode client created and cached", { sandboxId })
  return client
}

// ── Tool: opencodeReady ──────────────────────────────────────

export const opencodeReady = tool({
  description: [
    "Check if the OpenCode TUI HTTP server is ready and healthy.",
    "Returns { ready: true } when the server responds.",
    "",
    "Use this before sending prompts to verify the environment is up.",
  ].join("\n"),
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const client = await getOrCreateClient()
      const health = await client.global.health()
      return {
        ready: true,
        healthy: health.data?.healthy ?? true,
      }
    } catch (error) {
      return {
        ready: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
})

// ── Tool: opencodeAppendPrompt ───────────────────────────────

export const opencodeAppendPrompt = tool({
  description: [
    "Append text to the OpenCode TUI prompt input area.",
    "This injects text as if the user typed it into the TUI prompt.",
    "",
    "Use this to put the user's request into the TUI before calling",
    "opencodeSubmitPrompt to trigger the AI.",
    "",
    "Example:",
    '  opencodeAppendPrompt({ text: "Build a todo app with Next.js" })',
  ].join("\n"),
  inputSchema: z.object({
    text: z
      .string()
      .describe("The text to append to the TUI prompt input area."),
  }),
  execute: async ({ text }) => {
    const client = await getOrCreateClient()
    await client.tui.appendPrompt({ text })
    return { ok: true, appended: text.length }
  },
})

// ── Tool: opencodeSubmitPrompt ───────────────────────────────

export const opencodeSubmitPrompt = tool({
  description: [
    "Submit the current OpenCode TUI prompt, triggering the AI to respond.",
    "Call this AFTER opencodeAppendPrompt to start the AI workflow.",
    "",
    "The AI response will be visible in the terminal view.",
    "Use opencodeWait to detect when the AI finishes.",
  ].join("\n"),
  inputSchema: z.object({}),
  execute: async () => {
    const client = await getOrCreateClient()
    await client.tui.submitPrompt()
    return { ok: true }
  },
})

// ── Tool: opencodeWait (generator — streams events) ─────────

export const opencodeWait = tool({
  description: [
    "Wait for the OpenCode AI to finish processing the current prompt.",
    "Subscribes to the real-time event stream (SSE) and yields progress",
    "as the AI works. Detects session completion automatically.",
    "",
    "Auto-approves permission requests so the workflow continues smoothly.",
    "",
    "Use this AFTER opencodeSubmitPrompt to wait for the AI to finish",
    "before verifying results.",
    "",
    "Returns:",
    '  { status: "completed", sessionId: "..." }  — AI finished',
    '  { status: "timeout", ... }                  — timed out waiting',
    '  { status: "error", message: "..." }         — unexpected error',
  ].join("\n"),
  inputSchema: z.object({
    timeout: z
      .number()
      .optional()
      .default(300_000)
      .describe(
        "Maximum time to wait in milliseconds (default: 300000 = 5 min).",
      ),
  }),
  execute: async function* ({ timeout }) {
    const client = await getOrCreateClient()

    yield {
      status: "subscribed",
      message: "Listening for AI response events...",
    }

    let targetSessionId: string | null = null
    const startTime = Date.now()

    try {
      // Subscribe to SSE event stream
      const eventResult = await client.event.subscribe()

      for await (const rawEvent of eventResult.stream) {
        // Check timeout
        if (Date.now() - startTime > timeout) {
          yield {
            status: "timeout",
            message: "Timed out waiting for AI response",
            sessionId: targetSessionId,
            elapsedMs: Date.now() - startTime,
          }
          return
        }

        // Normalize event
        const event = unwrapOpenCodeEvent(rawEvent)
        if (!event) continue

        // Capture new session ID when a session is created
        if (event.type === "session.created") {
          const props = event.properties as { id?: string } | null
          if (props?.id) {
            targetSessionId = props.id
            yield {
              status: "started",
              sessionId: targetSessionId,
              message: "AI session started",
            }
          }
        }

        // Auto-approve permission requests so TUI workflow continues
        // Note: With the TUI's permission:allow config, these events
        // should rarely fire, but we handle them defensively.
        if (event.type === "permission.asked") {
          const props = event.properties as
            | { id?: string; sessionID?: string }
            | null
          if (props?.id) {
            try {
              await client.permission.reply({
                requestID: props.id,
                reply: "once",
              })
            } catch {
              // Fallback: try the respond endpoint
              try {
                await client.permission.respond({
                  sessionID: props.sessionID ?? "",
                  permissionID: props.id,
                  response: "once",
                })
              } catch {
                logger.debug("Permission auto-approval failed", {
                  permissionId: props.id,
                })
              }
            }
          }
        }

        // Stream text deltas so the agent can see progress
        if (event.type === "message.part.delta") {
          const props = event.properties as { delta?: string } | null
          if (props?.delta) {
            yield {
              status: "streaming",
              delta: props.delta,
              sessionId: targetSessionId,
            }
          }
        }

        // Stream tool execution updates
        if (event.type === "message.part.updated") {
          const part = (event.properties as { part?: { type?: string; tool?: string; state?: { status?: string; title?: string } } }).part
          if (part?.type === "tool" && part.tool) {
            yield {
              status: "tool",
              tool: part.tool,
              toolStatus: part.state?.status ?? "running",
              title: part.state?.title,
            }
          }
        }

        // Detect session completion (only if we know the target session)
        if (targetSessionId) {
          if (isOpenCodeSessionComplete(event, targetSessionId)) {
            yield {
              status: "completed",
              sessionId: targetSessionId,
              message: "AI response complete",
              elapsedMs: Date.now() - startTime,
            }
            return
          }
        } else {
          // No target session yet — check if any session completed
          // (handles case where session was created before we subscribed)
          const sid = getOpenCodeEventSessionId(event)
          if (sid && isOpenCodeSessionComplete(event, sid)) {
            targetSessionId = sid
            yield {
              status: "completed",
              sessionId: targetSessionId,
              message: "AI response complete (existing session)",
              elapsedMs: Date.now() - startTime,
            }
            return
          }
        }
      }

      // Event stream ended naturally
      yield {
        status: "ended",
        message: "Event stream ended",
        sessionId: targetSessionId,
        elapsedMs: Date.now() - startTime,
      }
    } catch (error) {
      yield {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        sessionId: targetSessionId,
        elapsedMs: Date.now() - startTime,
      }
    }
  },
})
