import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { github } from "@/lib/github"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    let projectId = searchParams.get("projectId")
    const chatId = searchParams.get("chatId")

    // Resolve project from chat if no explicit projectId
    if (!projectId && chatId) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: { projectId: true },
      })
      projectId = chat?.projectId ?? null
    }

    // Get user's connected GitHub account from BetterAuth
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "github",
      },
    })

    const hasOAuth = !!account

    if (!account) {
      return NextResponse.json({
        success: true,
        hasOAuth: false,
        github: null,
        installations: [],
      })
    }

    // Get GitHub App installations
    const installations = await github.listInstallations()

    // Get connected repository based on level
    let connectedRepo = null

    if (projectId) {
      // Project-level: Get repo for specific project
      const project = await prisma.project.findUnique({
        where: { id: projectId, userId: session.user.id },
        include: { gitRepos: true },
      })
      connectedRepo = project?.gitRepos[0]
    } else {
      // User-level: Get user's default repo (first one found)
      const project = await prisma.project.findFirst({
        where: { userId: session.user.id },
        include: { gitRepos: true },
      })
      connectedRepo = project?.gitRepos[0]
    }

    return NextResponse.json({
      success: true,
      hasOAuth: true,
      github: connectedRepo
        ? {
            owner: connectedRepo.owner,
            name: connectedRepo.name,
            url: `https://github.com/${connectedRepo.fullName}`,
            connected: true,
            level: projectId ? "project" : "user",
            projectId: connectedRepo.projectId,
          }
        : null,
      installations,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch GitHub config"
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, repoFullName, installationId, projectId: explicitProjectId, chatId, level = "project" } = body

    // Resolve project from chatId if provided
    let projectId = explicitProjectId
    if (!projectId && chatId) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: { projectId: true },
      })
      projectId = chat?.projectId ?? null
    }

    if (action === "connect") {
      if (!repoFullName || !installationId) {
        return NextResponse.json(
          { message: "repoFullName and installationId are required" },
          { status: 400 }
        )
      }

      const [owner, name] = repoFullName.split("/")
      if (!owner || !name) {
        return NextResponse.json(
          { message: "Invalid repository format. Use owner/name" },
          { status: 400 }
        )
      }

      // Get repo details from GitHub
      const repoDetails = await github.getRepo(owner, name, Number(installationId))

      // Create or update GitRepo
      const gitRepo = await prisma.gitRepo.upsert({
        where: { fullName: repoFullName },
        create: {
          owner,
          name,
          fullName: repoFullName,
          defaultBranch: repoDetails.defaultBranch,
          isPrivate: repoDetails.isPrivate,
          installationId: String(installationId),
        },
        update: {
          installationId: String(installationId),
          defaultBranch: repoDetails.defaultBranch,
        },
      })

      // Handle project linking based on level
      let project

      if (level === "project" && projectId) {
        // Project-level: Link to specific project
        project = await prisma.project.findUnique({
          where: { id: projectId, userId: session.user.id },
        })

        if (!project) {
          return NextResponse.json(
            { message: "Project not found" },
            { status: 404 }
          )
        }
      } else {
        // User-level: Link to user's default project (create if doesn't exist)
        project = await prisma.project.findFirst({
          where: { userId: session.user.id },
        })

        if (!project) {
          project = await prisma.project.create({
            data: {
              name: `${name} Project`,
              userId: session.user.id,
            },
          })
        }
      }

      // Update project to link to this repo
      await prisma.gitRepo.update({
        where: { id: gitRepo.id },
        data: { projectId: project.id },
      })

      return NextResponse.json({
        success: true,
        github: {
          owner,
          name,
          url: `https://github.com/${repoFullName}`,
          connected: true,
          level,
          projectId: project.id,
        },
      })
    } else if (action === "disconnect") {
      if (projectId) {
        // Project-level: Remove link for specific project
        await prisma.gitRepo.updateMany({
          where: { projectId },
          data: { projectId: null },
        })
      } else {
        // User-level: Remove project link from all repos for this user
        const project = await prisma.project.findFirst({
          where: { userId: session.user.id },
        })

        if (project) {
          await prisma.gitRepo.updateMany({
            where: { projectId: project.id },
            data: { projectId: null },
          })
        }
      }

      return NextResponse.json({
        success: true,
        github: null,
      })
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update GitHub config"
    return NextResponse.json({ message }, { status: 500 })
  }
}
