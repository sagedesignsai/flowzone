"use client"

import { Button } from "@/components/ui/button"
import { useEditorStore, type FileNode } from "@/stores/editor-store"
import {
  CaretRight,
  File,
  Folder,
  FolderOpen,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface FileTreeProps {
  files?: FileNode[]
  onFileSelect?: (path: string) => void
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "tsx":
    case "ts":
      return "🔷"
    case "jsx":
    case "js":
      return "🟨"
    case "json":
      return "📋"
    case "css":
      return "🎨"
    case "md":
      return "📝"
    default:
      return "📄"
  }
}

function FileTreeNode({
  node,
  level = 0,
  onFileSelect,
}: {
  node: FileNode
  level?: number
  onFileSelect?: (path: string) => void
}) {
  const expandedFolders = useEditorStore((s) => s.expandedFolders)
  const toggleFolder = useEditorStore((s) => s.toggleFolder)
  const selectedFile = useEditorStore((s) => s.selectedFile)
  const selectFile = useEditorStore((s) => s.selectFile)
  const openTab = useEditorStore((s) => s.openTab)

  const isExpanded = expandedFolders.has(node.path)
  const isSelected = selectedFile === node.path

  const handleFileClick = () => {
    selectFile(node.path)
    openTab({
      id: node.id,
      name: node.name,
      path: node.path,
      icon: node.icon,
    })
    onFileSelect?.(node.path)
  }

  if (node.type === "file") {
    return (
      <button
        onClick={handleFileClick}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <span>{getFileIcon(node.name)}</span>
        <span className="truncate">{node.name}</span>
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={() => toggleFolder(node.path)}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors",
          "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <CaretRight
          className={cn(
            "size-3.5 transition-transform flex-shrink-0",
            isExpanded && "rotate-90"
          )}
        />
        <span>{isExpanded ? "📂" : "📁"}</span>
        <span className="truncate">{node.name}</span>
      </button>

      {isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ files = [], onFileSelect }: FileTreeProps) {
  const fileTree = useEditorStore((s) => s.fileTree)
  const treesToRender = files.length > 0 ? files : fileTree

  if (treesToRender.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">No files</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {treesToRender.map((node) => (
          <FileTreeNode
            key={node.id}
            node={node}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  )
}
