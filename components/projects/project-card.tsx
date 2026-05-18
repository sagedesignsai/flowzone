import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { FolderSimple } from "@phosphor-icons/react"
import Link from "next/link"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProjectCardData {
  id: string
  name: string
  envVars?: Record<string, string>
  createdAt: Date | string
  updatedAt: Date | string
  chatCount?: number
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

// ─── Component ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectCardData
  className?: string
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const initials = project.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <Link href={`/projects/${project.id}`}>
      <Card
        className={cn(
          "group cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm",
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FolderSimple className="size-4" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-medium truncate">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  Updated {formatDate(project.updatedAt)}
                </CardDescription>
              </div>
            </div>

            {project.chatCount !== undefined && (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {project.chatCount} {project.chatCount === 1 ? "chat" : "chats"}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
