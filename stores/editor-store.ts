"use client"

import { create } from "zustand"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FileNode {
  id: string
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
  icon?: string
}

export interface EditorTab {
  id: string
  name: string
  path: string
  isDirty?: boolean
  icon?: string
}

export interface EditorState {
  // ─── File Tree ─────────────────────────────────────────────────────────
  fileTree: FileNode[]
  expandedFolders: Set<string>
  selectedFile: string | null
  
  // ─── Tabs ──────────────────────────────────────────────────────────────
  openTabs: EditorTab[]
  activeTabId: string | null
  
  // ─── Actions ───────────────────────────────────────────────────────────
  setFileTree: (tree: FileNode[]) => void
  toggleFolder: (path: string) => void
  expandFolder: (path: string) => void
  collapseFolder: (path: string) => void
  selectFile: (path: string) => void
  
  openTab: (tab: EditorTab) => void
  closeTab: (tabId: string) => void
  closeAllTabs: () => void
  setActiveTab: (tabId: string) => void
  markTabDirty: (tabId: string, isDirty: boolean) => void
  
  reset: () => void
}

// ─── Initial State ─────────────────────────────────────────────────────────

const initialState = {
  fileTree: [],
  expandedFolders: new Set<string>(),
  selectedFile: null,
  openTabs: [],
  activeTabId: null,
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()((set) => ({
  ...initialState,

  setFileTree: (tree) => set({ fileTree: tree }),

  toggleFolder: (path) =>
    set((state) => {
      const expanded = new Set(state.expandedFolders)
      if (expanded.has(path)) {
        expanded.delete(path)
      } else {
        expanded.add(path)
      }
      return { expandedFolders: expanded }
    }),

  expandFolder: (path) =>
    set((state) => {
      const expanded = new Set(state.expandedFolders)
      expanded.add(path)
      return { expandedFolders: expanded }
    }),

  collapseFolder: (path) =>
    set((state) => {
      const expanded = new Set(state.expandedFolders)
      expanded.delete(path)
      return { expandedFolders: expanded }
    }),

  selectFile: (path) => set({ selectedFile: path }),

  openTab: (tab) =>
    set((state) => {
      const exists = state.openTabs.find((t) => t.id === tab.id)
      if (exists) {
        return { activeTabId: tab.id }
      }
      return {
        openTabs: [...state.openTabs, tab],
        activeTabId: tab.id,
      }
    }),

  closeTab: (tabId) =>
    set((state) => {
      const filtered = state.openTabs.filter((t) => t.id !== tabId)
      let activeTabId = state.activeTabId
      if (activeTabId === tabId) {
        activeTabId = filtered.length > 0 ? filtered[filtered.length - 1].id : null
      }
      return { openTabs: filtered, activeTabId }
    }),

  closeAllTabs: () => set({ openTabs: [], activeTabId: null }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  markTabDirty: (tabId, isDirty) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) =>
        t.id === tabId ? { ...t, isDirty } : t
      ),
    })),

  reset: () => set(initialState),
}))
