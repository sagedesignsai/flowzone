export interface ChatListItem {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  projectId: string | null
  environment: string
}

export interface ChatDetailResponse {
  id: string
  title: string
  projectId: string | null
  desktopOptOut: boolean
  desktop: {
    sandboxId: string
    status: string
  } | null
}

export async function fetchChatList(): Promise<ChatListItem[]> {
  const response = await fetch("/api/chats")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to load chats")
  }

  const data = await response.json()
  return data.chats
}

export async function fetchChatDetail(chatId: string): Promise<ChatDetailResponse> {
  const response = await fetch(`/api/workspace/desktop/${chatId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to load chat")
  }

  return response.json()
}
