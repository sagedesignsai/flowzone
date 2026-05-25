import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { github } from "@/lib/github"
import type { GitCreatePRRequest } from "@/types"

/**
 * POST /api/github/pr
 *
 * Create a pull request from a chat's working branch back to the base branch.
 *
 * Request body: GitCreatePRRequest
 *   { owner, repo, installationId, head, base, title, body?, draft? }
 *
 * Alternatively, if chatId is provided, it will auto-populate from the
 * chat's git repo info:
 *   { chatId, title, body?, draft? }
 *
 * Response:
 *   201 { prNumber, prUrl, title, state }
 *   400 { error } — validation
 *   401 { error } — unauthorized
 *   403 { error } — chat not linked to a repo
 *   500 { error } — creation failed
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as GitCreatePRRequest & {
      chatId?: string
    }

    let {
      owner,
      repo,
      installationId,
      head,
      base,
      title,
      body: prBody,
      draft,
    } = body

    // ── If chatId is provided, resolve repo info from the chat ─
    if (body.chatId) {
      const chat = await prisma.chat.findUnique({
        where: { id: body.chatId },
        include: { gitRepo: true },
      })

      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 })
      }

      if (chat.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Chat does not belong to user" },
          { status: 403 }
        )
      }

      if (!chat.gitRepo || !chat.gitBranch) {
        return NextResponse.json(
          {
            error:
              "Chat is not linked to a Git repository. Import a repo first.",
          },
          { status: 400 }
        )
      }

      owner = chat.gitRepo.owner
      repo = chat.gitRepo.name
      installationId = Number(chat.gitRepo.installationId)
      head = chat.gitBranch
      base ??= chat.gitRepo.defaultBranch
    }

    // ── Validate resolved params ────────────────────────────
    if (!owner || !repo || !head) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: owner, repo, head. Provide directly or via chatId.",
        },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      )
    }

    // ── Create the pull request ─────────────────────────────
    const pr = await github.createPullRequest(
      owner,
      repo,
      head,
      base ?? "main",
      title,
      prBody,
      installationId,
      draft
    )

    return NextResponse.json(pr, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create pull request"
    console.error("POST /api/github/pr error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
