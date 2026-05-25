"use client"

import {
  Terminal,
  TerminalActions,
  TerminalClearButton,
  TerminalContent,
  TerminalCopyButton,
  TerminalHeader,
  TerminalStatus,
  TerminalTitle,
} from "@/components/ai-elements/terminal"
import { useIdeStore } from "@/hooks/use-ide-store"
import { cn } from "@/lib/utils"

interface TerminalViewProps {
  className?: string
}

export function TerminalView({ className }: TerminalViewProps) {
  const { terminalOutput, isTerminalStreaming, clearTerminalOutput } =
    useIdeStore()

  return (
    <Terminal
      autoScroll
      className={cn("size-full rounded-none border-0 border-t", className)}
      isStreaming={isTerminalStreaming}
      onClear={clearTerminalOutput}
      output={terminalOutput}
    >
      <TerminalHeader>
        <TerminalTitle />
        <div className="flex items-center gap-1">
          <TerminalStatus>
            <span className="animate-pulse">●</span>
            Running
          </TerminalStatus>
          <TerminalActions>
            <TerminalCopyButton />
            <TerminalClearButton />
          </TerminalActions>
        </div>
      </TerminalHeader>
      <TerminalContent className="max-h-full flex-1" />
    </Terminal>
  )
}
