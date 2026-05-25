/**
 * POST /api/desktop/[id] — Reconnect to an existing desktop sandbox
 *
 * Connects to a running desktop sandbox by ID, extends its timeout,
 * restarts the VNC stream if needed, and returns the stream URL.
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const maxDuration = 30

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    if (!id) {
      return Response.json({ error: "Sandbox ID is required" }, { status: 400 })
    }

    // Dynamic import to avoid loading @e2b/desktop when not needed
    const { Sandbox } = await import("@e2b/desktop")

    const timeoutMs = Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300000)

    const desktop = await Sandbox.connect(id)

    await desktop.setTimeout(timeoutMs)

    // Restart VNC stream: stop if running, then start fresh
    try {
      await desktop.stream.stop()
    } catch {
      // ignore — stream may not have been running
    }
    await desktop.stream.start()
    const vncUrl = desktop.stream.getUrl()

    return Response.json({ sandboxId: id, vncUrl })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/desktop/[id] error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
