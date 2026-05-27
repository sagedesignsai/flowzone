"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Separator } from "@/components/ui/separator"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useChatDesktop, useIdeStore } from "@/hooks/use-ide-store"
import { useEditorStore } from "@/stores/editor-store"
import { createDesktop } from "@/lib/desktop-client"
import {
  CaretLeft,
  CaretRight,
  Code,
  FileText,
  ArrowUpRight,
  ArrowClockwise,
  DotsThree,
  CaretDown,
  TerminalWindow,
  Monitor,
  SpinnerGap,
} from "@phosphor-icons/react"
import { toast } from "sonner"

interface EditorHeaderProps {
  chatId: string
  onNavigateBack?: () => void
  onNavigateForward?: () => void
  onRefresh?: () => void
}

export function EditorHeader({
  chatId,
  onNavigateBack,
  onNavigateForward,
  onRefresh,
}: EditorHeaderProps) {
  const { viewMode, setViewMode } = useIdeStore()
  const activeTabId = useEditorStore((s) => s.activeTabId)
  const openTabs = useEditorStore((s) => s.openTabs)
  const desktop = useChatDesktop(chatId)
  const setChatDesktop = useIdeStore((s) => s.setChatDesktop)
  const setChatDesktopStatus = useIdeStore((s) => s.setChatDesktopStatus)
  const [desktopLoading, setDesktopLoading] = useState(false)

  const activeTab = openTabs.find((t) => t.id === activeTabId)

  const handleDesktopClick = useCallback(async () => {
    if (desktop?.sandboxId && desktop.vncUrl) {
      setViewMode("desktop")
      return
    }

    setDesktopLoading(true)
    setChatDesktopStatus(chatId, "starting")

    try {
      const { sandboxId, vncUrl } = await createDesktop(chatId)
      setChatDesktop(chatId, { sandboxId, vncUrl, status: "running" })
      setViewMode("desktop")
    } catch (error) {
      setChatDesktopStatus(chatId, "error")
      toast.error(
        error instanceof Error ? error.message : "Failed to start desktop",
      )
    } finally {
      setDesktopLoading(false)
    }
  }, [chatId, desktop, setChatDesktop, setChatDesktopStatus, setViewMode])

  return (
    <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border bg-background px-3">
      {/* Left: View Icons */}
      <ToggleGroup spacing={0} orientation="horizontal">
        <ToggleGroupItem
          size="sm"
          pressed={viewMode === "code"}
          onPressedChange={() => setViewMode("code")}
          title="Code"
        >
          <Code className="size-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem
          size="sm"
          pressed={viewMode === "terminal"}
          onPressedChange={() => setViewMode("terminal")}
          title="Terminal"
        >
          <TerminalWindow className="size-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem
          size="sm"
          pressed={viewMode === "desktop"}
          onPressedChange={handleDesktopClick}
          title="Desktop"
          disabled={desktopLoading}
        >
          {desktopLoading ? (
            <SpinnerGap className="size-3.5 animate-spin" />
          ) : (
            <Monitor className="size-3.5" />
          )}
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Center: Navigation + Breadcrumb */}
      <div className="flex items-center gap-1">
        <ButtonGroup>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onNavigateBack}
            title="Back"
          >
            <CaretLeft className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onNavigateForward}
            title="Forward"
          >
            <CaretRight className="size-3.5" />
          </Button>
        </ButtonGroup>

        <Separator orientation="vertical" className="h-4" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Button size="icon-xs" variant="ghost">
            <FileText className="size-3.5" />
          </Button>
          <span>{activeTab?.name || "app.tsx"}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="ml-auto flex items-center gap-1">
        <Button size="icon-xs" variant="ghost" title="Open in new tab">
          <ArrowUpRight className="size-3.5" />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onRefresh}
          title="Refresh"
        >
          <ArrowClockwise className="size-3.5" />
        </Button>
        <Button size="icon-xs" variant="ghost" title="More options">
          <DotsThree className="size-3.5" />
        </Button>
      </div>

      {/* Far Right: Latest Dropdown */}
      <Separator orientation="vertical" className="h-4" />
      <ButtonGroup>
        <Button size="sm" variant="ghost" className="gap-1 text-xs">
          Latest
          <CaretDown className="size-3" />
        </Button>
        <Button size="icon-xs" variant="ghost" title="More">
          <DotsThree className="size-3.5" />
        </Button>
      </ButtonGroup>
    </div>
  )
}
