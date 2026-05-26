/**
 * GET /api/desktop/[id]/status
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  assertDesktopSandboxAccess,
  DesktopAccessError,
} from "@/lib/desktop/auth"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
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

    await assertDesktopSandboxAccess(session.user.id, id)

    const { Sandbox } = await import("@e2b/desktop")

    try {
      await Sandbox.connect(id)
      return Response.json({
        status: "running" as const,
      })
    } catch {
      return Response.json({ error: "Sandbox not found" }, { status: 404 })
    }
  } catch (error) {
    if (error instanceof DesktopAccessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("GET /api/desktop/[id]/status error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
