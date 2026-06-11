"use client"

import { Button } from "@/components/ui/button"
import { useIdeStore } from "@/hooks/use-ide-store"
import { Terminal, Plus } from "@phosphor-icons/react"
import { useRouter } from "nextjs-toploader/app"
import { useSearchParams } from "next/navigation"
import { nanoid } from "nanoid"

interface VirtualDevPtyIndexContentProps {
  className?: string
}

export function VirtualDevPtyIndexContent({
  className,
}: VirtualDevPtyIndexContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projectId")
  const { addChatSession, setActiveChatId } = useIdeStore()

  function handleNewChat() {
    const id = nanoid()
    addChatSession({
      id,
      title: "New chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      projectId,
    })
    setActiveChatId(id)
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""
    router.push(`/workspace/virtual-dev-pty/${id}${query}`)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Terminal className="size-8 text-primary" />
      </div>

      <div className="space-y-1.5 text-center">
        <h2 className="text-lg font-semibold tracking-tight">
          Virtual Developer (PTY)
        </h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          An AI developer with interactive terminal access. It can run opencode
          TUI, execute commands, and stream output in real-time.
        </p>
      </div>

      <Button onClick={handleNewChat} size="sm">
        <Plus className="mr-1.5 size-3.5" />
        New Chat
      </Button>
    </div>
  )
}
