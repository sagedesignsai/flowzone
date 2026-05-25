"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useEditorStore } from "@/stores/editor-store"
import { X, Circle } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export function EditorTabs() {
  const openTabs = useEditorStore((s) => s.openTabs)
  const activeTabId = useEditorStore((s) => s.activeTabId)
  const setActiveTab = useEditorStore((s) => s.setActiveTab)
  const closeTab = useEditorStore((s) => s.closeTab)

  if (openTabs.length === 0) {
    return null
  }

  return (
    <div className="flex h-9 shrink-0 items-center border-b border-border bg-background">
      <ScrollArea className="flex-1">
        <div className="flex gap-0.5 px-2">
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "group flex items-center gap-1.5 rounded-t-sm px-2.5 py-1 text-xs transition-colors",
                activeTabId === tab.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <button
                onClick={() => setActiveTab(tab.id)}
                className="flex min-w-0 flex-1 items-center gap-1.5"
              >
                {tab.isDirty && (
                  <Circle className="size-1.5 flex-shrink-0 fill-current" />
                )}
                <span className="truncate">{tab.name}</span>
              </button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => closeTab(tab.id)}
                className={cn(
                  "opacity-0 transition-opacity",
                  "group-hover:opacity-100"
                )}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  )
}
