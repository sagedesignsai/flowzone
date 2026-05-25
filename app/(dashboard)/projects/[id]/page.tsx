import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { title: "Project — Flowzone" }

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    select: { name: true },
  })

  return {
    title: project ? `${project.name} — Flowzone` : "Project — Flowzone",
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      _count: { select: { chats: true } },
      chats: {
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!project) notFound()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-base font-semibold">{project.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                Created{" "}
                {formatDistanceToNow(new Date(project.createdAt), {
                  addSuffix: true,
                })}
              </span>
              <span>·</span>
              <span>
                Updated{" "}
                {formatDistanceToNow(new Date(project.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          <Badge variant="secondary">Active</Badge>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-2xl font-semibold">{project._count.chats}</p>
            <p className="text-xs text-muted-foreground">
              {project._count.chats === 1 ? "Chat" : "Chats"}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-2xl font-semibold">1</p>
            <p className="text-xs text-muted-foreground">Git repos</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-2xl font-semibold">Active</p>
            <p className="text-xs text-muted-foreground">Status</p>
          </div>
        </div>

        {/* Recent chats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent Chats</h2>
            <Button
              nativeButton={false}
              render={<Link href="/chat" />}
              size="sm"
              variant="outline"
            >
              New Chat
            </Button>
          </div>

          {project.chats.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-xs text-muted-foreground">
                No chats yet in this project.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {project.chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-xs transition-colors hover:bg-accent"
                >
                  <span className="truncate font-medium">{chat.title}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDistanceToNow(new Date(chat.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
