"use client"

import { MessageResponse } from "@/components/ai-elements/message"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import {
  Sources,
  SourcesContent,
  SourcesTrigger,
  Source,
} from "@/components/ai-elements/sources"
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
} from "@/components/ai-elements/attachments"
import { cn } from "@/lib/utils"
import type { DynamicToolUIPart, ToolUIPart, UIMessage } from "ai"
import Image from "next/image"
import { memo, useMemo } from "react"

const prettifyName = (value: string) =>
  value
    .replace(/[-_]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase())

// ─── Text Part ──────────────────────────────────────────────────────────────

const TextPart = memo(function TextPart({
  text,
  state,
}: {
  text: string
  state?: "streaming" | "done"
}) {
  if (!text.trim() && state !== "streaming") return null

  return (
    <MessageResponse isAnimating={state === "streaming"}>
      {text}
    </MessageResponse>
  )
})

// ─── Reasoning Part ─────────────────────────────────────────────────────────

const ReasoningPart = memo(function ReasoningPart({
  text,
  state,
}: {
  text: string
  state?: "streaming" | "done"
}) {
  if (!text.trim() && state !== "streaming") return null

  return (
    <Reasoning className="my-3" isStreaming={state === "streaming"}>
      <ReasoningTrigger />
      <ReasoningContent>{text}</ReasoningContent>
    </Reasoning>
  )
})

// ─── Tool Part ──────────────────────────────────────────────────────────────

interface ToolPartProps {
  type: string
  state: string
  toolName?: string
  toolCallId: string
  input: unknown
  output?: unknown
  errorText?: string
  title?: string
}

const ToolPart = memo(function ToolPart({
  type,
  state,
  toolName: dynamicToolName,
  input,
  output,
  errorText,
  title,
}: ToolPartProps) {
  const resolvedType =
    type === "dynamic-tool"
      ? ("dynamic-tool" as const)
      : ("tool-invocation" as const)
  const resolvedState = state as
    | "input-streaming"
    | "input-available"
    | "approval-requested"
    | "approval-responded"
    | "output-available"
    | "output-error"
    | "output-denied"

  // Derive tool display name from type
  const derivedName = useMemo(() => {
    if (resolvedType === "dynamic-tool") {
      return prettifyName(dynamicToolName ?? "tool")
    }
    // ToolUIPart type is `tool-${toolName}`
    return prettifyName(type.split("-").slice(1).join("-"))
  }, [resolvedType, type, dynamicToolName])

  return (
    <Tool className="my-3">
      {resolvedType === "dynamic-tool" ? (
        <ToolHeader
          state={resolvedState as DynamicToolUIPart["state"]}
          title={title ?? derivedName}
          toolName={dynamicToolName ?? "tool"}
          type="dynamic-tool"
        />
      ) : (
        <ToolHeader
          state={resolvedState as ToolUIPart["state"]}
          title={title ?? derivedName}
          type={type as ToolUIPart["type"]}
        />
      )}
      <ToolContent>
        {input !== null && input !== undefined && <ToolInput input={input} />}
        {((output !== null && output !== undefined) ||
          (errorText !== null && errorText !== undefined)) && (
          <ToolOutput errorText={errorText ?? undefined} output={output} />
        )}
      </ToolContent>
    </Tool>
  )
})

// ─── Source Part ─────────────────────────────────────────────────────────────

interface SourcePartProps {
  sourceId: string
  url?: string
  title?: string
  mediaType?: string
  filename?: string
}

const SourcePart = memo(function SourcePart({
  sourceId,
  url,
  title,
}: SourcePartProps) {
  return <Source href={url ?? "#"} key={sourceId} title={title ?? "Source"} />
})

// ─── Sources Group ───────────────────────────────────────────────────────────

const SourcesGroup = memo(function SourcesGroup({
  parts,
}: {
  parts: SourcePartProps[]
}) {
  if (parts.length === 0) return null

  return (
    <Sources className="my-3">
      <SourcesTrigger count={parts.length} />
      <SourcesContent>
        {parts.map((s) => (
          <SourcePart key={s.sourceId} {...s} />
        ))}
      </SourcesContent>
    </Sources>
  )
})

// ─── File Part ───────────────────────────────────────────────────────────────

const FilePart = memo(function FilePart({
  url,
  mediaType,
  filename,
}: {
  url: string
  mediaType: string
  filename?: string
}) {
  return (
    <Attachments className="my-2" variant="list">
      <Attachment data={{ type: "file", mediaType, filename, url, id: url }}>
        <AttachmentPreview />
        <AttachmentInfo showMediaType />
      </Attachment>
    </Attachments>
  )
})

// ─── Screenshot Part ────────────────────────────────────────────────────────

const ScreenshotPart = memo(function ScreenshotPart({
  screenshot,
  width,
  height,
}: {
  screenshot: string
  width?: number
  height?: number
}) {
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-muted">
      <Image
        alt="Desktop screenshot"
        className="h-auto w-full"
        height={height ?? 600}
        unoptimized
        width={width ?? 800}
        src={`data:image/png;base64,${screenshot}`}
        style={{
          maxWidth: width ? `${Math.min(width, 800)}px` : "100%",
          maxHeight: height ? `${Math.min(height, 600)}px` : "auto",
        }}
      />
    </div>
  )
})

// ─── Step Start Part ─────────────────────────────────────────────────────────

const StepStartDivider = memo(function StepStartDivider() {
  return (
    <div className="flex items-center justify-end gap-2 py-1">
      <div className="h-px flex-1 border-t border-dashed border-border/40" />
      <span className="text-[10px] font-medium tracking-wider text-muted-foreground/60 uppercase">
        Step
      </span>
    </div>
  )
})

// ─── Main Parts Renderer ─────────────────────────────────────────────────────

interface MessagePartsProps {
  parts: UIMessage["parts"]
  className?: string
}

export const MessageParts = memo(function MessageParts({
  parts,
  className,
}: MessagePartsProps) {
  // Collect source parts to render as a group
  const sourceParts: SourcePartProps[] = []

  const rendered = parts.map((part, index) => {
    switch (part.type) {
      case "text": {
        return <TextPart key={index} state={part.state} text={part.text} />
      }

      case "reasoning": {
        return <ReasoningPart key={index} state={part.state} text={part.text} />
      }

      case "file": {
        return (
          <FilePart
            key={index}
            filename={part.filename}
            mediaType={part.mediaType}
            url={part.url}
          />
        )
      }

      case "step-start": {
        return <StepStartDivider key={index} />
      }

      case "dynamic-tool": {
        // Handle desktop tool results (screenshots, etc.)
        const toolPart = part as DynamicToolUIPart
        if (
          toolPart.toolName === "takeScreenshot" &&
          toolPart.output?.screenshot
        ) {
          return (
            <ScreenshotPart
              key={index}
              screenshot={toolPart.output.screenshot}
              width={toolPart.output.width}
              height={toolPart.output.height}
            />
          )
        }
        // Fall through to default tool handling
        return (
          <ToolPart
            key={toolPart.toolCallId ?? index}
            errorText={toolPart.errorText}
            input={toolPart.input}
            output={toolPart.output}
            state={toolPart.state}
            title={toolPart.title}
            toolCallId={toolPart.toolCallId}
            toolName={toolPart.toolName}
            type={toolPart.type}
          />
        )
      }

      case "source-url":
      case "source-document": {
        sourceParts.push({
          sourceId: part.sourceId,
          url: part.type === "source-url" ? part.url : undefined,
          title: part.type === "source-document" ? part.title : part.title,
          mediaType:
            part.type === "source-document" ? part.mediaType : undefined,
          filename: part.type === "source-document" ? part.filename : undefined,
        })
        return null // rendered as group below
      }

      default: {
        // ToolUIPart type is `tool-${name}`, DynamicToolUIPart is `dynamic-tool`
        if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
          const toolPart = part as ToolUIPart | DynamicToolUIPart
          return (
            <ToolPart
              key={toolPart.toolCallId ?? index}
              errorText={toolPart.errorText}
              input={toolPart.input}
              output={toolPart.output}
              state={toolPart.state}
              title={toolPart.title}
              toolCallId={toolPart.toolCallId}
              toolName={toolPart.toolName}
              type={toolPart.type}
            />
          )
        }

        return null
      }
    }
  })

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {rendered}
      {sourceParts.length > 0 && <SourcesGroup parts={sourceParts} />}
    </div>
  )
})
