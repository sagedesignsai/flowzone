/**
 * Terminal API Route
 *
 * GET  /api/desktop/terminal?chatId=xxx  — SSE stream of PTY output
 * POST /api/desktop/terminal               — Send input or resize
 *
 * Body (POST):
 *   { action: "input", chatId, data: "..." }
 *   { action: "resize", chatId, cols: 120, rows: 40 }
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  getTerminalSession,
} from "@/lib/desktop/terminal-store"
import { DesktopAccessError } from "@/lib/desktop/auth"

export const runtime = "nodejs"
export const maxDuration = 600

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

    const termSession = await getTerminalSession(chatId, session.user.id)
    if (!termSession) {
      return Response.json(
        { error: "No terminal session found" },
        { status: 404 },
      )
    }

    const { Sandbox } = await import("@e2b/desktop")
    const desktop = await Sandbox.connect(termSession.sandboxId)

    const stream = new ReadableStream({
      start: async (controller) => {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected", ptyPid: termSession.ptyPid })}\n\n`),
        )

        try {
          const handle = await desktop.pty.connect(termSession.ptyPid, {
            onData: (data: Uint8Array) => {
              const text = new TextDecoder().decode(data)
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: "output", data: text })}\n\n`,
                ),
              )
            },
          })

          req.signal.addEventListener("abort", () => {
            handle.disconnect().catch(() => {})
          })
        } catch (error) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "error", data: String(error) })}\n\n`,
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
    if (error instanceof DesktopAccessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    console.error("GET /api/desktop/terminal error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
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

    const termSession = await getTerminalSession(chatId, authSession.user.id)
    if (!termSession) {
      return Response.json(
        { error: "No terminal session found" },
        { status: 404 },
      )
    }

    const { Sandbox } = await import("@e2b/desktop")
    const desktop = await Sandbox.connect(termSession.sandboxId)

    if (action === "input") {
      if (!body.data) {
        return Response.json({ error: "data is required" }, { status: 400 })
      }
      await desktop.pty.sendInput(
        termSession.ptyPid,
        new TextEncoder().encode(body.data),
      )
      return Response.json({ ok: true })
    }

    if (action === "resize") {
      const cols = body.cols ?? 120
      const rows = body.rows ?? 40
      await desktop.pty.resize(termSession.ptyPid, { cols, rows })
      return Response.json({ ok: true })
    }

    return Response.json(
      { error: "Invalid action. Use 'input' or 'resize'." },
      { status: 400 },
    )
  } catch (error) {
    if (error instanceof DesktopAccessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    console.error("POST /api/desktop/terminal error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
