/**
 * Code Agent Terminal API Route
 *
 * Provides real-time terminal access for the PTY-powered code agent.
 * Connects directly to the sandbox PTY via sandbox.pty.connect()
 * for live terminal output streaming.
 *
 * GET  /api/workspace/code-agent/terminal?chatId=xxx  — SSE stream
 * POST /api/workspace/code-agent/terminal               — Send input
 *
 * POST body:
 *   { action: "input", chatId, data: "..." }
 *   { action: "resize", chatId, cols: 120, rows: 40 }
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  getPtyChatSession,
} from "@/lib/pty/pty-store"
import { assertChatAccess } from "@/lib/desktop/auth"

export const runtime = "nodejs"
export const maxDuration = 600

// ── Helpers ───────────────────────────────────────────────

type PendingPtyState = {
  chatId: string
  encoder: TextEncoder
  controller: ReadableStreamDefaultController<Uint8Array>
  signal: AbortSignal
}

/**
 * Polls for PTY session creation and connects to it.
 * Returns `true` if connected, `false` if aborted.
 */
async function pollAndConnectPty(state: PendingPtyState): Promise<boolean> {
  const { chatId, encoder, controller, signal } = state
  const pollInterval = 800
  const maxPollTime = 120_000 // 2 minutes before giving up
  const startTime = Date.now()

  while (Date.now() - startTime < maxPollTime) {
    if (signal.aborted) return false

    const ptySession = getPtyChatSession(chatId)
    if (ptySession) {
      // PTY available — connect
      try {
        const { Sandbox } = await import("e2b")
        const sandbox = await Sandbox.connect(ptySession.sandboxId)

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "connected", sandboxId: ptySession.sandboxId, ptyPid: ptySession.ptyPid })}\n\n`,
          ),
        )

        const handle = await sandbox.pty.connect(ptySession.ptyPid, {
          onData: (data: Uint8Array) => {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "output", data: new TextDecoder().decode(data) })}\n\n`,
                ),
              )
            } catch {
              // Stream closed
            }
          },
        })

        signal.addEventListener("abort", () => {
          handle.disconnect().catch(() => {})
        })

        return true
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", data: `PTY connection failed: ${error instanceof Error ? error.message : String(error)}` })}\n\n`,
          ),
        )
        controller.close()
        return false
      }
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  // Timed out waiting for PTY
  controller.enqueue(
    encoder.encode(
      `data: ${JSON.stringify({ type: "error", data: "Timed out waiting for PTY session (2 min)" })}\n\n`,
    ),
  )
  controller.close()
  return false
}

// ── SSE Stream ────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get("chatId")
    if (!chatId) {
      return Response.json({ error: "chatId is required" }, { status: 400 })
    }

    // Verify chat ownership
    await assertChatAccess(session.user.id, chatId)

    const encoder = new TextEncoder()

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const ptySession = getPtyChatSession(chatId)

        if (!ptySession) {
          // PTY not available yet — send a waiting event and poll
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "waiting", data: "Waiting for sandbox to start..." })}\n\n`,
            ),
          )

          await pollAndConnectPty({
            chatId,
            encoder,
            controller,
            signal: req.signal,
          })
          return
        }

        // PTY exists — connect immediately
        try {
          const { Sandbox } = await import("e2b")
          const sandbox = await Sandbox.connect(ptySession.sandboxId)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "connected", sandboxId: ptySession.sandboxId, ptyPid: ptySession.ptyPid })}\n\n`,
            ),
          )

          const handle = await sandbox.pty.connect(ptySession.ptyPid, {
            onData: (data: Uint8Array) => {
              try {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "output", data: new TextDecoder().decode(data) })}\n\n`,
                  ),
                )
              } catch {
                // Stream closed
              }
            },
          })

          req.signal.addEventListener("abort", () => {
            handle.disconnect().catch(() => {})
          })
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", data: `PTY connection failed: ${error instanceof Error ? error.message : String(error)}` })}\n\n`,
            ),
          )
          controller.close()
        }
      },
      cancel: () => {},
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500
    console.error("GET /api/workspace/code-agent/terminal error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status },
    )
  }
}

// ── Input / Resize ────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    })
    if (!authSession) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as {
      action: "input" | "resize"
      chatId: string
      data?: string
      cols?: number
      rows?: number
    }

    const { action, chatId } = body
    if (!chatId) {
      return Response.json({ error: "chatId is required" }, { status: 400 })
    }

    // Verify chat ownership
    await assertChatAccess(authSession.user.id, chatId)

    const ptySession = getPtyChatSession(chatId)
    if (!ptySession) {
      return Response.json(
        { error: "No active PTY session for this chat. Send a message first to start the sandbox." },
        { status: 404 },
      )
    }

    // Import Sandbox dynamically (avoids loading E2B SDK in every request)
    const { Sandbox } = await import("e2b")
    const sandbox = await Sandbox.connect(ptySession.sandboxId)

    if (action === "input") {
      if (!body.data) {
        return Response.json({ error: "data is required" }, { status: 400 })
      }
      await sandbox.pty.sendInput(
        ptySession.ptyPid,
        new TextEncoder().encode(body.data),
      )
      return Response.json({ ok: true })
    }

    if (action === "resize") {
      const cols = body.cols ?? 120
      const rows = body.rows ?? 40
      await sandbox.pty.resize(ptySession.ptyPid, { cols, rows })
      return Response.json({ ok: true })
    }

    return Response.json(
      { error: "Invalid action. Use 'input' or 'resize'." },
      { status: 400 },
    )
  } catch (error) {
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500
    console.error("POST /api/workspace/code-agent/terminal error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status },
    )
  }
}
