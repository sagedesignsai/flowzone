"use client"

import { cn } from "@/lib/utils"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface WorkspaceLayoutProps {
  topBar?: React.ReactNode
  chatPanel: React.ReactNode
  previewPanel: React.ReactNode
  className?: string
}

export function WorkspaceLayout({
  topBar,
  chatPanel,
  previewPanel,
  className,
}: WorkspaceLayoutProps) {
  return (
    <div className={cn("flex h-screen flex-col", className)}>
      {topBar && (
        <div className="shrink-0 border-b border-border">
          {topBar}
        </div>
      )}
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          {chatPanel}
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={65} minSize={50}>
          {previewPanel}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
