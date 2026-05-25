"use client"

import { EditorView } from "@/components/editor/editor-view"
import { PreviewView } from "@/components/editor/preview-view"
import { TerminalView } from "@/components/editor/terminal-view"
import { DesktopView } from "@/components/editor/desktop-view"
import { EditorHeader } from "@/components/editor/editor-header"
import { EditorTabs } from "@/components/editor/editor-tabs"
import { useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"
import type { ComponentProps } from "react"

interface EditorPanelProps extends ComponentProps<"div"> {
  chatId?: string
  previewUrl?: string
}

export function EditorPanel({
  chatId,
  previewUrl,
  className,
  ...props
}: EditorPanelProps) {
  const { viewMode } = useIdeStore()

  return (
    <div
      className={cn(
        "flex size-full flex-col overflow-hidden bg-background",
        className
      )}
      {...props}
    >
      <EditorHeader chatId={chatId ?? ""} />
      <EditorTabs />

      <AnimatePresence initial={false} mode="wait">
        {viewMode === "preview" && (
          <motion.div
            key="preview"
            animate={{ opacity: 1 }}
            className="size-full"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <PreviewView url={previewUrl} />
          </motion.div>
        )}

        {viewMode === "code" && (
          <motion.div
            key="code"
            animate={{ opacity: 1 }}
            className="size-full"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <EditorView />
          </motion.div>
        )}

        {viewMode === "terminal" && (
          <motion.div
            key="terminal"
            animate={{ opacity: 1 }}
            className="size-full"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <TerminalView />
          </motion.div>
        )}

        {viewMode === "desktop" && (
          <motion.div
            key="desktop"
            animate={{ opacity: 1 }}
            className="size-full"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            <DesktopView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
