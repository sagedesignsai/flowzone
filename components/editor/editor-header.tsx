"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Separator } from "@/components/ui/separator"
import { useIdeStore } from "@/hooks/use-ide-store"
import { useEditorStore } from "@/stores/editor-store"
import {
  CaretLeft,
  CaretRight,
  Eye,
  Code,
  FileText,
  ArrowUpRight,
  ArrowClockwise,
  DotsThree,
  CaretDown,
} from "@phosphor-icons/react"

interface EditorHeaderProps {
  onNavigateBack?: () => void
  onNavigateForward?: () => void
  onRefresh?: () => void
}

export function EditorHeader({
  onNavigateBack,
  onNavigateForward,
  onRefresh,
}: EditorHeaderProps) {
  const { viewMode, setViewMode, desktopSandboxId } = useIdeStore()
  const activeTabId = useEditorStore((s) => s.activeTabId)
  const openTabs = useEditorStore((s) => s.openTabs)

  const activeTab = openTabs.find((t) => t.id === activeTabId)

  return (
    <div className="flex h-10 shrink-0 items-center gap-3 border-b border-border bg-background px-3">
      {/* Left: Collapse + View Icons */}
      <ButtonGroup>
        <Button size="icon-xs" variant="ghost" title="Collapse">
          <CaretLeft className="size-3.5" />
        </Button>
        <Button size="icon-xs" variant="ghost" title="Preview">
          <Eye className="size-3.5" />
        </Button>
        <Button size="icon-xs" variant="ghost" title="Code">
          <Code className="size-3.5" />
        </Button>
        <Button size="icon-xs" variant="ghost" title="Files">
          <FileText className="size-3.5" />
        </Button>
      </ButtonGroup>

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
