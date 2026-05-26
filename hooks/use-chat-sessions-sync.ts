"use client"

import { useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import { useIdeStore, type ChatSession } from "@/hooks/use-ide-store"
import { fetchChatList } from "@/lib/chat/client/api"

/**
 * Hydrate sidebar chat sessions from the database on mount.
 */
export function useChatSessionsSync() {
  const { data: session } = useSession()
  const setChatSessions = useIdeStore((s) => s.setChatSessions)
  const addChatSession = useIdeStore((s) => s.addChatSession)

  useEffect(() => {
    if (!session?.user) return

    let cancelled = false

    fetchChatList()
      .then((chats) => {
        if (cancelled) return

        const fromServer: ChatSession[] = chats.map((c) => ({
          id: c.id,
          title: c.title,
          createdAt: new Date(c.createdAt).getTime(),
          updatedAt: new Date(c.updatedAt).getTime(),
          projectId: c.projectId,
        }))

        const local = useIdeStore.getState().chatSessions
        const serverIds = new Set(fromServer.map((c) => c.id))
        const localOnly = local.filter((c) => !serverIds.has(c.id))

        setChatSessions([...localOnly, ...fromServer])
      })
      .catch((err) => {
        console.error("Failed to sync chat sessions:", err)
      })

    return () => {
      cancelled = true
    }
  }, [session?.user, setChatSessions])

  return { addChatSession }
}
