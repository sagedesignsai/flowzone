/**
 * GET /api/github/sandbox?chatId=xxx
 *
 * Get the current sandbox status and context for a chat.
 * Returns whether a sandbox is running, the repo path, branch, etc.
 */

import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")

    if (!chatId) {
      return NextResponse.json(
        { error: "Missing required query param: chatId" },
        { status: 400 }
      )
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        gitRepo: true,
        sandboxRun: true,
      },
    })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const sandboxRun = chat.sandboxRun

    return NextResponse.json({
      hasSandbox: !!sandboxRun,
      sandbox: sandboxRun
        ? {
            id: sandboxRun.id,
            e2bSandboxId: sandboxRun.e2bSandboxId,
            status: sandboxRun.status,
            templateId: sandboxRun.templateId,
            repoPath: sandboxRun.repoPath,
            gitBranch: sandboxRun.gitBranch,
            expiresAt: sandboxRun.expiresAt,
          }
        : null,
      repository: chat.gitRepo
        ? {
            owner: chat.gitRepo.owner,
            name: chat.gitRepo.name,
            fullName: chat.gitRepo.fullName,
            branch: chat.gitBranch,
            defaultBranch: chat.gitRepo.defaultBranch,
          }
        : null,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get sandbox status"
    console.error("GET /api/github/sandbox error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
