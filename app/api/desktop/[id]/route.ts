/**
 * POST /api/desktop/[id] — Reconnect to an existing desktop sandbox
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  assertDesktopSandboxAccess,
  DesktopAccessError,
} from "@/lib/desktop/auth"
import { reconnectDesktopSandbox } from "@/lib/desktop/create-sandbox"

export const maxDuration = 30

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    await assertDesktopSandboxAccess(session.user.id, id)

    const { sandboxId, vncUrl } = await reconnectDesktopSandbox(id)

    return Response.json({ sandboxId, vncUrl })
  } catch (error) {
    if (error instanceof DesktopAccessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/desktop/[id] error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
