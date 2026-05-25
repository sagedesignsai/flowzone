/**
 * POST /api/github/import
 *
 * Import a GitHub repository into a chat:
 *   1. Verify auth + chat ownership
 *   2. Create or find GitRepo record in DB
 *   3. Create a dedicated branch (flowzone/{chatId})
 *   4. Create an E2B sandbox for the chat
 *   5. Clone the repo into the sandbox
 *   6. Store sandbox context (repoPath, gitBranch) in the SandboxRun record
 *   7. Update chat with gitRepoId and gitBranch
 *   8. Return repo + sandbox info
 *
 * This replaces the previous best-effort approach. The sandbox is now
 * guaranteed to exist after import, and its context is persisted for
 * the chat route to pick up.
 */

import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getInstallationToken, getRepo } from "@/lib/github"
import { createBranch } from "@/lib/github/branches"
import type { GitImportRequest, GitImportResponse } from "@/types"
import { Sandbox } from "e2b"

const GIT_USERNAME = "x-access-token"
const DEFAULT_REPO_PATH = "/home/user/repo"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.E2B_API_KEY) {
    return NextResponse.json(
      { error: "E2B_API_KEY is not configured. Sandbox features require it." },
      { status: 500 }
    )
  }

  try {
    const body = (await request.json()) as GitImportRequest

    // ── Validate input ──────────────────────────────────────
    if (!body.chatId || !body.repo?.owner || !body.repo?.name) {
      return NextResponse.json(
        { error: "Missing required fields: chatId, repo.owner, repo.name" },
        { status: 400 }
      )
    }

    const { chatId, repo: repoInput } = body
    const fullName = `${repoInput.owner}/${repoInput.name}`

    // ── Verify chat exists and belongs to user ──────────────
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { gitRepo: true, sandboxRun: true },
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
          isPrivate: false,
          installationId: String(repoInput.installationId),
          projectId: chat.projectId,
        },
      })

      // Fetch actual repo details to update isPrivate / defaultBranch
      try {
        const repoDetails = await getRepo(
          repoInput.owner,
          repoInput.name,
          repoInput.installationId
        )
        gitRepo = await prisma.gitRepo.update({
          where: { id: gitRepo.id },
          data: {
            isPrivate: repoDetails.isPrivate,
            isFork: repoDetails.isFork,
            defaultBranch: repoDetails.defaultBranch,
            description: repoDetails.description,
            language: repoDetails.language,
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
      await createBranch({
        owner: repoInput.owner,
        repo: repoInput.name,
        baseBranch,
        newBranch: chatBranch,
        installationId: repoInput.installationId,
      })
    } catch {
      // Branch may already exist from a previous import — that's fine
    }

    // ── Get a fresh installation token for cloning ──────────
    const { token } = await getInstallationToken(repoInput.installationId)

    // ── Create or reconnect to sandbox ──────────────────────
    let sandbox: Sandbox
    let sandboxId: string
    let isExisting = false

    if (chat.sandboxRun?.e2bSandboxId) {
      // Try to reconnect to existing sandbox
      try {
        sandbox = await Sandbox.connect(chat.sandboxRun.e2bSandboxId)
        sandboxId = chat.sandboxRun.e2bSandboxId
        isExisting = true
      } catch {
        // Sandbox expired — create a new one
        sandbox = await Sandbox.create()
        sandboxId = sandbox.sandboxId
      }
    } else {
      // Create a new sandbox
      sandbox = await Sandbox.create()
      sandboxId = sandbox.sandboxId
    }

    // ── Clone the repo into the sandbox ────────────────────
    const clonePath = `${DEFAULT_REPO_PATH}/${fullName}`

    await sandbox.git.clone(`https://github.com/${fullName}.git`, {
      path: clonePath,
      branch: chatBranch,
      depth: 1,
      username: GIT_USERNAME,
      password: token,
    })

    // Checkout the chat branch
    await sandbox.commands.run(
      `cd ${clonePath} && git checkout ${chatBranch} 2>/dev/null || true`
    )

    // Configure git identity inside the sandbox
    await sandbox.commands.run(
      `cd ${clonePath} && git config user.name "Flowzone Bot" && git config user.email "bot@flowzone.dev"`
    )

    // ── Persist sandbox context in DB ───────────────────────
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    if (chat.sandboxRun) {
      await prisma.sandboxRun.update({
        where: { id: chat.sandboxRun.id },
        data: {
          e2bSandboxId: sandboxId,
          status: "running",
          repoPath: clonePath,
          gitBranch: chatBranch,
          expiresAt,
        },
      })
    } else {
      await prisma.sandboxRun.create({
        data: {
          chatId,
          e2bSandboxId: sandboxId,
          status: "running",
          repoPath: clonePath,
          gitBranch: chatBranch,
          expiresAt,
        },
      })
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
