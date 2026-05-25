"use client"

import { Button } from "@/components/ui/button"
import {
  ProjectCard,
  type ProjectCardData,
} from "@/components/projects/project-card"
import { cn } from "@/lib/utils"
import { FolderSimple } from "@phosphor-icons/react"
import Link from "next/link"

// ─── Props ─────────────────────────────────────────────────────────────────

interface ProjectListProps {
  projects: ProjectCardData[]
  className?: string
  totalCount?: number
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProjectList({
  projects,
  className,
  totalCount,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <FolderSimple className="size-7 text-muted-foreground/40" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">No projects yet</p>
          <p className="text-xs text-muted-foreground">
            Start a new chat and your projects will appear here.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/chat" />} size="sm">
          Start building
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {totalCount !== undefined && (
        <p className="text-xs text-muted-foreground">
          {totalCount} {totalCount === 1 ? "project" : "projects"}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
