"use client"

import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
} from "@/components/ai-elements/web-preview"
import { cn } from "@/lib/utils"
import {
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
} from "@phosphor-icons/react"
import { useCallback, useRef } from "react"

interface PreviewViewProps {
  /** URL to render in the iframe preview. Defaults to sandboxed empty state. */
  url?: string
  className?: string
}

export function PreviewView({ url = "", className }: PreviewViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      // Reload iframe by reassigning src
      iframeRef.current.src = iframeRef.current.src
    }
  }, [])

  const handleOpen = useCallback(() => {
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }, [url])

  return (
    <WebPreview
      className={cn("size-full rounded-none border-0", className)}
      defaultUrl={url}
    >
      <WebPreviewNavigation>
        <WebPreviewNavigationButton disabled tooltip="Back">
          <ArrowLeft className="size-3.5" />
        </WebPreviewNavigationButton>
        <WebPreviewNavigationButton disabled tooltip="Forward">
          <ArrowRight className="size-3.5" />
        </WebPreviewNavigationButton>
        <WebPreviewNavigationButton onClick={handleRefresh} tooltip="Refresh">
          <ArrowClockwise className="size-3.5" />
        </WebPreviewNavigationButton>
        <WebPreviewUrl className="mx-1" />
        <WebPreviewNavigationButton
          disabled={!url}
          onClick={handleOpen}
          tooltip="Open in new tab"
        >
          <ArrowSquareOut className="size-3.5" />
        </WebPreviewNavigationButton>
      </WebPreviewNavigation>
      <WebPreviewBody ref={iframeRef} />
    </WebPreview>
  )
}
