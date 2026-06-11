import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { killDesktopSandbox } from "@/lib/desktop/kill"
import {
  deleteDesktopRunRecord,
  markDesktopRunStopped,
} from "@/lib/desktop/persistence"
import { assertChatOwnership } from "@/lib/chat/access"

/**
 * GET /api/workspace/desktop/[id] — Chat metadata and desktop state.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const chat = await prisma.chat.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      projectId: true,
      userId: true,
      desktopOptOut: true,
      desktopRun: {
        select: { e2bSandboxId: true, status: true },
      },
    },
  })

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 })
  }

  if (chat.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    id: chat.id,
    title: chat.title,
    projectId: chat.projectId,
    desktopOptOut: chat.desktopOptOut,
    desktop:
      chat.desktopRun && chat.desktopRun.status !== "stopped"
        ? {
            sandboxId: chat.desktopRun.e2bSandboxId,
            status: chat.desktopRun.status,
          }
        : null,
  })
}

/**
 * PATCH /api/workspace/desktop/[id] — Update chat settings (e.g. desktop opt-out).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await assertChatOwnership(id, session.user.id)
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as { desktopOptOut?: boolean }

  if (body.desktopOptOut === true) {
    const sandboxId = await deleteDesktopRunRecord(id)
    if (sandboxId) {
      await killDesktopSandbox(sandboxId)
    }

    await prisma.chat.upsert({
      where: { id },
      update: { desktopOptOut: true },
      create: {
        id,
        title: "New Chat",
        userId: session.user.id,
        desktopOptOut: true,
      },
    })
  } else if (body.desktopOptOut === false) {
    await prisma.chat.update({
      where: { id },
      data: { desktopOptOut: false },
    })
  }

  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/workspace/desktop/[id]
 *
 * Delete a chat and kill associated E2B sandboxes (code + desktop).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const chat = await prisma.chat.findUnique({
    where: { id },
    select: {
      userId: true,
      sandboxRun: { select: { e2bSandboxId: true } },
      desktopRun: { select: { e2bSandboxId: true } },
    },
  })

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 })
  }
  if (chat.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (chat.sandboxRun?.e2bSandboxId && process.env.E2B_API_KEY) {
    try {
      const { Sandbox } = await import("e2b")
      await Sandbox.kill(chat.sandboxRun.e2bSandboxId)
    } catch {
      // sandbox may already be gone
    }
  }

  if (chat.desktopRun?.e2bSandboxId) {
    await killDesktopSandbox(chat.desktopRun.e2bSandboxId)
  }

  await prisma.chat.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
