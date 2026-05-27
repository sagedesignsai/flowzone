/**
 * POST /api/desktop   — Create or resume a desktop sandbox for a chat
 * DELETE /api/desktop — Kill a desktop sandbox (authorized)
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import {
  assertChatAccess,
  assertDesktopSandboxAccess,
  DesktopAccessError,
} from "@/lib/desktop/auth"
import { getOrCreateDesktopSandbox } from "@/lib/desktop/create-sandbox"
import { killDesktopSandbox } from "@/lib/desktop/kill"
import { markDesktopRunStopped } from "@/lib/desktop/persistence"

export const maxDuration = 310

export async function POST(req: Request) {
  try {
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

    const { chatId, projectId } = (await req.json()) as {
      chatId?: string
      projectId?: string
    }

    if (!chatId) {
      return Response.json({ error: "chatId is required" }, { status: 400 })
    }

    const access = await assertChatAccess(session.user.id, chatId)
    if (access.desktopOptOut) {
      return Response.json(
        { error: "Desktop is disabled for this chat" },
        { status: 400 },
      )
    }

    const { sandboxId, vncUrl, ptyPid } = await getOrCreateDesktopSandbox({
      chatId,
      projectId,
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
    })

    await prisma.chat.upsert({
      where: { id: chatId },
      update: { desktopOptOut: false },
      create: {
        id: chatId,
        title: "New Chat",
        userId: session.user.id,
        projectId: projectId ?? null,
      },
    })

    return Response.json({ sandboxId, vncUrl, ptyPid })
  } catch (error) {
    if (error instanceof DesktopAccessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    const template =
      process.env.E2B_DESKTOP_TEMPLATE ?? "flowzone-desktop-dev"
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/desktop error:", error)
    return Response.json(
      {
        error: `Desktop sandbox creation failed (template: "${template}"): ${message}`,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sandboxId, chatId } = (await req.json()) as {
      sandboxId?: string
      chatId?: string
    }

    if (!sandboxId) {
      return Response.json({ error: "sandboxId is required" }, { status: 400 })
    }

    const access = await assertDesktopSandboxAccess(
      session.user.id,
      sandboxId,
    )

    if (chatId && chatId !== access.chatId) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    await killDesktopSandbox(sandboxId)
    await markDesktopRunStopped(access.chatId)

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof DesktopAccessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("DELETE /api/desktop error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
