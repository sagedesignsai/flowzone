"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useSettingsStore } from "@/stores/settings-store"
import { cn } from "@/lib/utils"
import {
  ArrowUpRight,
  CaretDown,
  FolderOpen,
  GitBranch,
  PlusCircle,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"

interface ProjectItem {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  gitRepos: {
    fullName: string
    owner: string
    name: string
    defaultBranch: string
  }[]
  _count: { chats: number }
}

interface ProjectContextSelectorProps {
  selectedProjectId: string | null
  onSelectProject: (id: string | null) => void
}

export function ProjectContextSelector({
  selectedProjectId,
  onSelectProject,
}: ProjectContextSelectorProps) {
  const router = useRouter()
  const { github, hasOAuth, setGithub } = useSettingsStore()
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showNewInput, setShowNewInput] = useState(false)
  const [newName, setNewName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch("/api/projects")
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Session expired. Please sign in again."
            : `Failed to load projects (${res.status})`,
        )
      }
      const data = await res.json()
      setProjects(data.projects ?? [])
      if (
        (!data.projects || data.projects.length === 0) &&
        hasOAuth
      ) {
        setFetchError("No projects yet. Create one to get started.")
      }
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load projects",
      )
    } finally {
      setLoading(false)
    }
  }, [hasOAuth])

  useEffect(() => {
    if (hasOAuth) {
      fetchProjects()
    }
  }, [hasOAuth, fetchProjects])

  useEffect(() => {
    if (showNewInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showNewInput])

  const handleCreateProject = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return

      setCreating(true)
      setShowNewInput(false)
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        })
        if (res.ok) {
          const data = await res.json()
          const newProject: ProjectItem = data.project
          setProjects((prev) => [newProject, ...prev])
          onSelectProject(newProject.id)
          setGithub(null)
        }
      } catch {
        // Silently fail
      } finally {
        setCreating(false)
        setOpen(false)
      }
    },
    [onSelectProject, setGithub],
  )

  const handleSelectProject = useCallback(
    (project: ProjectItem) => {
      onSelectProject(project.id)
      if (project.gitRepos.length > 0) {
        const repo = project.gitRepos[0]
        setGithub({
          connected: true,
          name: repo.name,
          owner: repo.owner,
          projectId: project.id,
          url: `https://github.com/${repo.fullName}`,
        })
      } else {
        setGithub(null)
      }
      setOpen(false)
    },
    [onSelectProject, setGithub],
  )

  const selected = projects.find((p) => p.id === selectedProjectId)
  const selectedRepo = selected?.gitRepos[0]

  // ── No GitHub OAuth ───────────────────────────
  if (!hasOAuth) {
    return (
      <Link
        href="/settings/github"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <FolderOpen className="size-3" />
        Connect GitHub
      </Link>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            type="button"
          />
        }
      >
        <FolderOpen
          className={cn("size-3", selected && "text-primary")}
        />
        {selected ? (
          <span>{selected.name}</span>
        ) : (
          <span>Select project</span>
        )}
        {loading ? (
          <Spinner className="size-2.5" />
        ) : (
          <CaretDown className="size-2.5" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
          {loading ? "Loading projects…" : "Project"}
        </DropdownMenuLabel>
        </DropdownMenuGroup>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Spinner className="size-5" />
          </div>
        )}

        {/* Fetch error */}
        {fetchError && !loading && (
          <div className="px-2 py-2">
            <p className="mb-2 text-xs text-destructive">{fetchError}</p>
            <button
              className="text-xs text-primary hover:underline"
              onClick={fetchProjects}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && projects.length === 0 && (
          <DropdownMenuItem disabled>
            No projects yet
          </DropdownMenuItem>
        )}

        {/* Project list */}
        {projects.map((project) => {
          const isSelected = project.id === selectedProjectId
          const repo = project.gitRepos[0]
          return (
            <DropdownMenuItem
              key={project.id}
              onSelect={() => handleSelectProject(project)}
            >
              <FolderOpen
                className={cn(
                  "mr-2 size-3.5 shrink-0",
                  isSelected && "text-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate">{project.name}</div>
                {repo && (
                  <div className="truncate text-[10px] text-muted-foreground">
                    <GitBranch className="-mt-0.5 mr-0.5 inline size-2.5" />
                    {repo.fullName}
                  </div>
                )}
              </div>
              {isSelected && (
                <span className="text-[10px] text-primary">Active</span>
              )}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />

        {/* Create new project */}
        {showNewInput ? (
          <div className="px-2 py-1.5">
            <input
              className="w-full rounded-sm border border-input bg-transparent px-2 py-1 text-xs outline-none focus:border-ring"
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleCreateProject(newName)
                  setNewName("")
                }
                if (e.key === "Escape") {
                  setShowNewInput(false)
                  setNewName("")
                }
              }}
              onChange={(e) => setNewName(e.currentTarget.value)}
              placeholder="Project name"
              ref={inputRef}
              type="text"
              value={newName}
            />
          </div>
        ) : (
          <DropdownMenuItem
            disabled={creating}
            onSelect={() => setShowNewInput(true)}
          >
            {creating ? (
              <Spinner className="mr-2 size-3.5" />
            ) : (
              <PlusCircle className="mr-2 size-3.5 text-muted-foreground" />
            )}
            <span>Create new project</span>
          </DropdownMenuItem>
        )}

        {/* Start without project */}
        {selectedProjectId && (
          <DropdownMenuItem
            onSelect={() => {
              onSelectProject(null)
              setGithub(null)
              setOpen(false)
            }}
          >
            <span className="mr-2 size-3.5 shrink-0 text-muted-foreground">
              —
            </span>
            <span>Start without project</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            router.push("/projects")
            setOpen(false)
          }}
        >
          <ArrowUpRight className="mr-2 size-3.5" />
          <span>Manage projects</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
