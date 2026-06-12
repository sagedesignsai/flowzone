"use client"

import { useEffect, useRef } from "react"
import { useSession } from "@/lib/auth-client"
import { useIdeStore, type ChatSession } from "@/hooks/use-ide-store"
import { fetchChatList } from "@/lib/chat/client/api"

/**
 * Hydrate sidebar chat sessions from the database on mount.
 *
 * When the authenticated user changes (different user logs in), stale
 * persisted sessions from the previous user are discarded first — this
 * prevents cross-user chat leaks via the Zustand persist middleware.
 */
export function useChatSessionsSync() {
  const { data: session } = useSession()
  const setChatSessions = useIdeStore((s) => s.setChatSessions)
  const addChatSession = useIdeStore((s) => s.addChatSession)
  const prevUserId = useRef<string | undefined>(undefined)
  const prevHadUser = useRef(false)

  useEffect(() => {
    const userId = session?.user?.id
    const hasUser = !!userId

    // ── User signed out ─────────────────────────────────────────────────
    // Clear persisted sessions so they don't leak to the next user.
    if (prevHadUser.current && !hasUser) {
      setChatSessions([])
    }

    // ── User switched (different user on same browser) ──────────────────
    // Discard stale entries from the previous user.
    if (hasUser && prevUserId.current !== undefined && prevUserId.current !== userId) {
      setChatSessions([])
    }

    prevHadUser.current = hasUser
    prevUserId.current = userId

    if (!userId) return

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
          environment: c.environment as ChatSession["environment"],
        }))

        // Merge server sessions with local-only sessions (chats created
        // client-side that haven't been persisted to the DB yet).
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
