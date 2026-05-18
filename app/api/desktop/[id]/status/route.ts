/**
 * GET /api/desktop/[id]/status
 *
 * Get the status of a desktop sandbox.
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.E2B_API_KEY) {
      return Response.json(
        { error: "E2B_API_KEY is not configured" },
        { status: 500 },
      )
    }

    // Dynamic import — avoids loading @e2b/desktop when not configured
    const { Sandbox } = await import("@e2b/desktop")

    try {
      const desktop = await Sandbox.connect(id)
      
      // If we can connect, sandbox is still running
      return Response.json({
        status: "running",
        timeRemaining: 300, // Placeholder — E2B doesn't expose remaining time
      })
    } catch (error) {
      // Sandbox not found or already terminated
      return Response.json(
        { error: "Sandbox not found" },
        { status: 404 },
      )
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("GET /api/desktop/[id]/status error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
