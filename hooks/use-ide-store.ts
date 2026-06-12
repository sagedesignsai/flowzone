"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ViewMode = "code" | "terminal" | "desktop"

export type ChatEnvironment = "code-agent" | "desktop"

export type DesktopStatus =
  | "idle"
  | "starting"
  | "running"
  | "stopping"
  | "error"

export interface ChatSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  projectId?: string | null
  environment?: ChatEnvironment
}

export interface ChatDesktopRecord {
  sandboxId: string
  vncUrl: string
  status: DesktopStatus
  ptyPid?: number
}

export interface IdeFile {
  path: string
  content: string
  language: string
}

interface IdeState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  activeChatId: string | null
  setActiveChatId: (id: string | null) => void

  chatSessions: ChatSession[]
  setChatSessions: (sessions: ChatSession[]) => void
  addChatSession: (session: ChatSession) => void
  removeChatSession: (id: string) => void
  updateChatSession: (id: string, partial: Partial<ChatSession>) => void

  /** Per-chat desktop sandbox (keyed by chatId). */
  chatDesktops: Record<string, ChatDesktopRecord>
  setChatDesktop: (
    chatId: string,
    record: Omit<ChatDesktopRecord, "status"> & { status?: DesktopStatus },
  ) => void
  setChatDesktopStatus: (chatId: string, status: DesktopStatus) => void
  clearChatDesktop: (chatId: string) => void

  openFile: IdeFile | null
  setOpenFile: (file: IdeFile | null) => void

  terminalOutput: string
  appendTerminalOutput: (text: string) => void
  clearTerminalOutput: () => void
  isTerminalStreaming: boolean
  setTerminalStreaming: (streaming: boolean) => void

  selectedModel: string
  setSelectedModel: (model: string) => void

  gitBranch: string | null
  gitRepoOwner: string | null
  gitRepoName: string | null
  gitRepoFullName: string | null
  setGitBranch: (branch: string | null) => void
  setGitRepoInfo: (owner: string, name: string, fullName: string) => void
}

export const useIdeStore = create<IdeState>()(
  persist(
    (set) => ({
      viewMode: "code",
      setViewMode: (mode) => set({ viewMode: mode }),

      activeChatId: null,
      setActiveChatId: (id) => set({ activeChatId: id }),

      chatSessions: [],
      setChatSessions: (sessions) => set({ chatSessions: sessions }),
      addChatSession: (session) =>
        set((s) => {
          const filtered = s.chatSessions.filter((c) => c.id !== session.id)
          return { chatSessions: [session, ...filtered] }
        }),
      removeChatSession: (id) =>
        set((s) => {
          const { [id]: _removed, ...restDesktops } = s.chatDesktops
          return {
            chatSessions: s.chatSessions.filter((c) => c.id !== id),
            chatDesktops: restDesktops,
            activeChatId: s.activeChatId === id ? null : s.activeChatId,
          }
        }),
      updateChatSession: (id, partial) =>
        set((s) => ({
          chatSessions: s.chatSessions.map((c) =>
            c.id === id ? { ...c, ...partial, updatedAt: Date.now() } : c,
          ),
        })),

      chatDesktops: {},
      setChatDesktop: (chatId, record) =>
        set((s) => ({
          chatDesktops: {
            ...s.chatDesktops,
            [chatId]: {
              sandboxId: record.sandboxId,
              vncUrl: record.vncUrl,
              status: record.status ?? "running",
              ptyPid: record.ptyPid,
            },
          },
        })),
      setChatDesktopStatus: (chatId, status) =>
        set((s) => {
          const current = s.chatDesktops[chatId]
          return {
            chatDesktops: {
              ...s.chatDesktops,
              [chatId]: {
                sandboxId: current?.sandboxId ?? "",
                vncUrl: current?.vncUrl ?? "",
                status,
              },
            },
          }
        }),
      clearChatDesktop: (chatId) =>
        set((s) => {
          const { [chatId]: _removed, ...rest } = s.chatDesktops
          return { chatDesktops: rest }
        }),

      openFile: null,
      setOpenFile: (file) => set({ openFile: file }),

      terminalOutput: "",
      appendTerminalOutput: (text) =>
        set((s) => ({ terminalOutput: s.terminalOutput + text })),
      clearTerminalOutput: () => set({ terminalOutput: "" }),
      isTerminalStreaming: false,
      setTerminalStreaming: (streaming) =>
        set({ isTerminalStreaming: streaming }),

      selectedModel: "claude-4-5-opus",
      setSelectedModel: (model) => set({ selectedModel: model }),

      gitBranch: null,
      gitRepoOwner: null,
      gitRepoName: null,
      gitRepoFullName: null,
      setGitBranch: (branch) => set({ gitBranch: branch }),
      setGitRepoInfo: (owner, name, fullName) =>
        set({
          gitRepoOwner: owner,
          gitRepoName: name,
          gitRepoFullName: fullName,
        }),
    }),
    {
      name: "flowzone-ide",
      partialize: (s) => ({
        chatSessions: s.chatSessions,
        selectedModel: s.selectedModel,
        viewMode: s.viewMode,
        chatDesktops: s.chatDesktops,
        gitBranch: s.gitBranch,
        gitRepoOwner: s.gitRepoOwner,
        gitRepoName: s.gitRepoName,
        gitRepoFullName: s.gitRepoFullName,
      }),
    },
  ),
)

/** Select desktop state for a specific chat. */
export function useChatDesktop(chatId: string) {
  return useIdeStore((s) => s.chatDesktops[chatId] ?? null)
}
