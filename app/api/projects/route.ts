import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        gitRepos: {
          select: {
            fullName: true,
            owner: true,
            name: true,
            defaultBranch: true,
          },
        },
        _count: { select: { chats: true } },
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name } = (await request.json()) as { name?: string }

    const project = await prisma.project.create({
      data: {
        name: name?.trim() || `Project ${new Date().toLocaleDateString()}`,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
