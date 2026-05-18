import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { ProjectList } from "@/components/projects/project-list"

export const metadata = {
  title: "Projects — Flowzone",
  description: "Manage your Flowzone projects.",
}

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const projects = session
    ? await prisma.project.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { chats: true } } },
      })
    : []

  const projectCards = projects.map((p) => ({
    id: p.id,
    name: p.name,
    envVars: (p.envVars ?? {}) as Record<string, string>,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    chatCount: p._count.chats,
  }))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-base font-semibold">Projects</h1>
        <p className="text-xs text-muted-foreground">
          All your Flowzone projects in one place.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <ProjectList projects={projectCards} totalCount={projects.length} />
      </div>
    </div>
  )
}
