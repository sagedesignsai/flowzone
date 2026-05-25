"use client"

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContainer,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"
import { File as FileIcon } from "@phosphor-icons/react"
import type { BundledLanguage } from "shiki"

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
    <ScrollArea className={cn("size-full", className)}>
      <CodeBlockContainer language={openFile.language}>
        <CodeBlockHeader>
          <CodeBlockTitle>
            <FileIcon className="size-3.5" />
            <CodeBlockFilename>{openFile.path}</CodeBlockFilename>
          </CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton className="size-6" />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlock
          code={openFile.content}
          language={openFile.language as BundledLanguage}
          showLineNumbers
        />
      </CodeBlockContainer>
    </ScrollArea>
  )
}
