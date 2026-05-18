/**
 * Desktop Client Helpers
 *
 * Client-side utilities for desktop sandbox management and communication.
 */

export interface DesktopCreateResponse {
  sandboxId: string
  vncUrl: string
}

export interface DesktopStatusResponse {
  status: "running" | "stopping" | "stopped"
  timeRemaining: number
}

/**
 * Create a new desktop sandbox
 */
export async function createDesktop(
  chatId: string,
  projectId?: string
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
 * Delete a desktop sandbox
 */
export async function deleteDesktop(sandboxId: string): Promise<void> {
  const response = await fetch("/api/desktop", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sandboxId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete desktop")
  }
}

/**
 * Get desktop sandbox status
 */
export async function getDesktopStatus(
  sandboxId: string
): Promise<DesktopStatusResponse> {
  const response = await fetch(`/api/desktop/${sandboxId}/status`)

  if (!response.ok) {
    throw new Error("Failed to get desktop status")
  }

  return response.json()
}

/**
 * Send message to desktop agent
 */
export async function sendDesktopMessage(
  chatId: string,
  messages: any[],
  sandboxId: string
): Promise<Response> {
  return fetch(`/api/chat/${chatId}/desktop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, sandboxId }),
  })
}
