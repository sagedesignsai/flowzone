/**
 * Desktop Client Helpers
 *
 * Client-side utilities for desktop sandbox management.
 */

export interface DesktopCreateResponse {
  sandboxId: string
  vncUrl: string
  ptyPid?: number
}

export interface DesktopStatusResponse {
  status: "running" | "stopping" | "stopped"
  timeRemaining: number
}

/**
 * Create or resume a desktop sandbox for a chat.
 */
export async function createDesktop(
  chatId: string,
  projectId?: string,
): Promise<DesktopCreateResponse> {
  const response = await fetch("/api/desktop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, projectId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create desktop")
  }

  return response.json()
}

/**
 * Opt out of desktop for a chat (chat-only mode).
 */
export async function optOutDesktop(chatId: string): Promise<void> {
  const response = await fetch(`/api/chat/${chatId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ desktopOptOut: true }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update chat")
  }
}

/**
 * Delete a desktop sandbox.
 */
export async function deleteDesktop(
  sandboxId: string,
  chatId?: string,
): Promise<void> {
  const response = await fetch("/api/desktop", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sandboxId, chatId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete desktop")
  }
}

/**
 * Get desktop sandbox status.
 */
export async function getDesktopStatus(
  sandboxId: string,
): Promise<DesktopStatusResponse> {
  const response = await fetch(`/api/desktop/${sandboxId}/status`)

  if (!response.ok) {
    throw new Error("Failed to get desktop status")
  }

  return response.json()
}

export { fetchChatDetail, fetchChatList } from "@/lib/chat/client/api"
export type { ChatDetailResponse, ChatListItem } from "@/lib/chat/client/api"
