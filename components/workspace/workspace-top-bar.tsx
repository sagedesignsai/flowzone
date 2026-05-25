"use client"

import { Button } from "@/components/ui/button"
import { Settings, Share2, GitBranch } from "lucide-react"

export function WorkspaceTopBar() {
  return (
    <div className="flex h-12 items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Workspace</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="size-4" />
          Settings
        </Button>

        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="size-4" />
          Share
        </Button>

        <Button variant="ghost" size="sm" className="gap-2">
          <GitBranch className="size-4" />
          View Branch
        </Button>
      </div>
    </div>
  )
}
