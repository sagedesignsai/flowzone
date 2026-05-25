import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * DELETE /api/chat/[id]
 *
 * Delete a chat and its associated E2B sandbox.
 * The Prisma cascade deletes the SandboxRun automatically,
 * but we must explicitly kill the E2B sandbox first.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // 1. Authenticate
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Verify ownership and load sandbox info
  const chat = await prisma.chat.findUnique({
    where: { id },
    select: {
      userId: true,
      sandboxRun: { select: { e2bSandboxId: true } },
    },
  })
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 })
  }
  if (chat.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 3. Kill the E2B sandbox if one exists
  if (chat.sandboxRun?.e2bSandboxId && process.env.E2B_API_KEY) {
    try {
      const { Sandbox } = await import("e2b")
      await Sandbox.kill(chat.sandboxRun.e2bSandboxId)
    } catch {
      // sandbox may already be gone — ignore
    }
  }

  // 4. Delete the chat (cascades to SandboxRun, Messages, etc.)
  await prisma.chat.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
