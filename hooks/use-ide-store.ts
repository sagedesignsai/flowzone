"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ViewMode = "preview" | "code" | "terminal";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface IdeFile {
  path: string;
  content: string;
  language: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store Shape
// ─────────────────────────────────────────────────────────────────────────────

interface IdeState {
  // ─── Editor panel view ────────────────────────────────────────────
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // ─── Active chat session ──────────────────────────────────────────
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;

  // ─── Chat history (list of sessions for sidebar) ──────────────────
  chatSessions: ChatSession[];
  addChatSession: (session: ChatSession) => void;
  removeChatSession: (id: string) => void;
  updateChatSession: (id: string, partial: Partial<ChatSession>) => void;

  // ─── Message history for active chat ─────────────────────────────
  messages: Record<string, ChatMessage[]>;
  addMessage: (chatId: string, message: ChatMessage) => void;
  clearMessages: (chatId: string) => void;

  // ─── Open file in editor ──────────────────────────────────────────
  openFile: IdeFile | null;
  setOpenFile: (file: IdeFile | null) => void;

  // ─── Terminal output ──────────────────────────────────────────────
  terminalOutput: string;
  appendTerminalOutput: (text: string) => void;
  clearTerminalOutput: () => void;
  isTerminalStreaming: boolean;
  setTerminalStreaming: (streaming: boolean) => void;

  // ─── Selected model ───────────────────────────────────────────────
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useIdeStore = create<IdeState>()(
  persist(
    (set) => ({
      // View
      viewMode: "preview",
      setViewMode: (mode) => set({ viewMode: mode }),

      // Active chat
      activeChatId: null,
      setActiveChatId: (id) => set({ activeChatId: id }),

      // Sessions
      chatSessions: [],
      addChatSession: (session) =>
        set((s) => ({ chatSessions: [session, ...s.chatSessions] })),
      removeChatSession: (id) =>
        set((s) => ({
          chatSessions: s.chatSessions.filter((c) => c.id !== id),
        })),
      updateChatSession: (id, partial) =>
        set((s) => ({
          chatSessions: s.chatSessions.map((c) =>
            c.id === id ? { ...c, ...partial } : c
          ),
        })),

      // Messages
      messages: {},
      addMessage: (chatId, message) =>
        set((s) => ({
          messages: {
            ...s.messages,
            [chatId]: [...(s.messages[chatId] ?? []), message],
          },
        })),
      clearMessages: (chatId) =>
        set((s) => ({
          messages: { ...s.messages, [chatId]: [] },
        })),

      // File
      openFile: null,
      setOpenFile: (file) => set({ openFile: file }),

      // Terminal
      terminalOutput: "",
      appendTerminalOutput: (text) =>
        set((s) => ({ terminalOutput: s.terminalOutput + text })),
      clearTerminalOutput: () => set({ terminalOutput: "" }),
      isTerminalStreaming: false,
      setTerminalStreaming: (streaming) =>
        set({ isTerminalStreaming: streaming }),

      // Model
      selectedModel: "claude-4-5-opus",
      setSelectedModel: (model) => set({ selectedModel: model }),
    }),
    {
      name: "flowzone-ide",
      partialize: (s) => ({
        chatSessions: s.chatSessions,
        messages: s.messages,
        selectedModel: s.selectedModel,
        viewMode: s.viewMode,
      }),
    }
  )
);
