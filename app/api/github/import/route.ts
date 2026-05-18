import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { github } from "@/lib/github"
import type { GitImportRequest, GitImportResponse } from "@/types"
import { Sandbox } from "e2b"

/**
 * POST /api/github/import
 *
 * Import a GitHub repository into a chat:
 *   1. Verify auth + chat ownership
 *   2. Create or find GitRepo record in DB
 *   3. Ensure the E2B sandbox exists for the chat
 *   4. Create a dedicated branch (flowzone/{chatId})
 *   5. Clone the repo into the sandbox
 *   6. Return repo + branch + sandbox info
 *
 * Request body: GitImportRequest
 *   { chatId: string, repo: { owner, name, installationId, branch? } }
 *
 * Response:
 *   200 { gitRepoId, chatBranch, sandboxId, clonePath }
 *   400 { error } — validation
 *   401 { error } — unauthorized
 *   404 { error } — chat not found
 *   500 { error } — server error
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as GitImportRequest

    // ── Validate input ──────────────────────────────────────
    if (!body.chatId || !body.repo?.owner || !body.repo?.name) {
      return NextResponse.json(
        { error: "Missing required fields: chatId, repo.owner, repo.name" },
        { status: 400 },
      )
    }

    const { chatId, repo: repoInput } = body
    const fullName = `${repoInput.owner}/${repoInput.name}`

    // ── Verify chat exists and belongs to user ──────────────
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { gitRepo: true },
    })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Chat does not belong to user" },
        { status: 403 },
      )
    }

    // ── Create or get GitRepo record ────────────────────────
    let gitRepo = chat.gitRepo

    if (!gitRepo) {
      gitRepo = await prisma.gitRepo.upsert({
        where: { fullName },
        update: {
          installationId: String(repoInput.installationId),
        },
        create: {
          owner: repoInput.owner,
          name: repoInput.name,
          fullName,
          defaultBranch: repoInput.branch ?? "main",
          isPrivate: false, // Will be updated after fetching from API
          installationId: String(repoInput.installationId),
          projectId: chat.projectId,
        },
      })

      // Fetch actual repo details to update isPrivate / defaultBranch
      try {
        const repoDetails = await github.getRepo(
          repoInput.owner,
          repoInput.name,
          repoInput.installationId,
        )
        gitRepo = await prisma.gitRepo.update({
          where: { id: gitRepo.id },
          data: {
            isPrivate: repoDetails.isPrivate,
            defaultBranch: repoDetails.defaultBranch,
          },
        })
      } catch {
        // Non-critical — continue with defaults
      }
    }

    // ── Create a dedicated branch for this chat ─────────────
    const baseBranch = repoInput.branch ?? gitRepo.defaultBranch
    const chatBranch = `flowzone/${chatId.slice(0, 8)}`

    try {
      await github.createBranch(
        repoInput.owner,
        repoInput.name,
        baseBranch,
        chatBranch,
        repoInput.installationId,
      )
    } catch {
      // Branch may already exist from a previous import — that's fine
    }

    // ── Get or create the E2B sandbox for the chat ─────────
    let sandboxRun = await prisma.sandboxRun.findUnique({
      where: { chatId },
    })

    let sandboxId: string | null = null
    let clonePath = `/home/user/repo/${fullName}`

    if (sandboxRun?.e2bSandboxId) {
      sandboxId = sandboxRun.e2bSandboxId
    }

    // Get a fresh installation token for cloning
    const { token } = await github.getInstallationToken(
      repoInput.installationId,
    )

    // Try to clone into the sandbox (non-blocking — sandbox may not be running)
    try {
      if (sandboxRun?.e2bSandboxId) {
        const e2bSandbox = await Sandbox.connect(sandboxRun.e2bSandboxId)

        await e2bSandbox.git.clone(
          `https://github.com/${fullName}.git`,
          {
            path: clonePath,
            branch: chatBranch,
            depth: 1,
            username: "x-access-token",
            password: token,
          },
        )

        // Checkout the chat branch
        await e2bSandbox.commands.run(
          `cd ${clonePath} && git checkout ${chatBranch} 2>/dev/null || echo "checked out"`,
        )
      }
    } catch {
      // Sandbox clone is best-effort at import time.
      // The sandbox will clone on first real connection.
      clonePath = `/home/user/repo/${fullName}`
    }

    // ── Update chat with repo info ──────────────────────────
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        gitRepoId: gitRepo.id,
        gitBranch: chatBranch,
      },
    })

    const response: GitImportResponse = {
      gitRepoId: gitRepo.id,
      chatBranch,
      sandboxId,
      clonePath,
    }

    return NextResponse.json(response)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import repository"
    console.error("POST /api/github/import error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
