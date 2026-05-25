"use client"

import { CodeEditor } from "@/components/editor/code-editor"
import { FileTree } from "@/components/editor/file-tree"
import { useIdeStore } from "@/hooks/use-ide-store"
import { useEditorStore } from "@/stores/editor-store"
import { cn } from "@/lib/utils"
import { File as FileIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"

interface EditorViewProps {
  className?: string
}

export function EditorView({ className }: EditorViewProps) {
  const { openFile } = useIdeStore()
  const showFileTree = useEditorStore((s) => s.showFileTree)

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
      <AnimatePresence initial={false}>
        {showFileTree && (
          <motion.aside
            animate={{ width: 220, opacity: 1 }}
            className="flex-shrink-0 overflow-hidden border-r border-border"
            exit={{ width: 0, opacity: 0 }}
            initial={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
          >
            <div className="w-[220px]">
              <div className="flex h-9 items-center border-b border-border px-3 text-xs font-medium text-muted-foreground">
                Files
              </div>
              <FileTree />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

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
