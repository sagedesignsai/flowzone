"use client"

import { CodeEditor } from "@/components/editor/code-editor"
import { FileTree } from "@/components/editor/file-tree"
import { useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"
import { File as FileIcon } from "@phosphor-icons/react"

interface EditorViewProps {
  className?: string
}

export function EditorView({ className }: EditorViewProps) {
  const { openFile } = useIdeStore()

  if (!openFile) {
    return (
      <div
        className={cn(
          "flex size-full flex-col items-center justify-center gap-3 text-center",
          className
        )}
      >
        <FileIcon className="size-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">No file open</p>
      </div>
    )
  }

  return (
    <div className={cn("flex size-full overflow-hidden", className)}>
      <aside className="w-[220px] shrink-0 overflow-y-auto border-r border-border">
        <div className="flex h-9 items-center border-b border-border px-3 text-xs font-medium text-muted-foreground">
          Files
        </div>
        <FileTree />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <CodeEditor
          className="size-full overflow-hidden"
          language={openFile.path}
          readOnly
          value={openFile.content}
        />
      </div>
    </div>
  )
}
