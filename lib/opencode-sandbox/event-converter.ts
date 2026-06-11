import type {
  FilePart,
  Message,
  Part,
  ReasoningPart,
  StepFinishPart,
  TextPart,
  ToolPart,
} from "@opencode-ai/sdk/v2"
import type { UIMessageStreamWriter } from "ai"
import { logger } from "@/lib/logger"
import { convertOpenCodeFilePartToUIChunks } from "@/lib/opencode-sandbox/file-parts"

const STRUCTURED_OUTPUT_TOOL = "StructuredOutput"

interface UsageTotals {
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cachedInputTokens: number
  cachedWriteTokens: number
  totalCost: number
}

interface ToolStreamState {
  toolName: string
  inputStarted: boolean
  inputEmitted: boolean
  outputEmitted: boolean
  lastInputText?: string
  emittedAttachmentIds: Set<string>
}

interface ConverterState {
  textPartId?: string
  textStarted: boolean
  reasoningPartId?: string
  reasoningStarted: boolean
  textContentByPart: Map<string, string>
  reasoningContentByPart: Map<string, string>
  toolStates: Map<string, ToolStreamState>
  usage: UsageTotals
  messageRoles: Map<string, Message["role"]>
  lastAssistantMessage?: Message
  permissionRequests: Set<string>
  questionRequests: Set<string>
}

export interface NormalizedOpenCodeEvent {
  type: string
  properties?: unknown
}

export function unwrapOpenCodeEvent(event: unknown): NormalizedOpenCodeEvent | null {
  if (typeof event !== "object" || event === null) return null

  const record = event as Record<string, unknown>
  if (typeof record.type === "string") {
    return record as unknown as NormalizedOpenCodeEvent
  }

  const payload = record.payload
  if (typeof payload === "object" && payload !== null) {
    const payloadRecord = payload as Record<string, unknown>
    if (typeof payloadRecord.type === "string") {
      return payloadRecord as unknown as NormalizedOpenCodeEvent
    }
  }

  return null
}

export function getOpenCodeEventSessionId(event: NormalizedOpenCodeEvent): string | undefined {
  const props = event.properties
  if (typeof props !== "object" || props === null) return undefined

  const record = props as Record<string, unknown>
  const part = record.part
  if (typeof part === "object" && part !== null) {
    const sessionId = (part as Record<string, unknown>).sessionID
    if (typeof sessionId === "string") return sessionId
  }

  const info = record.info
  if (typeof info === "object" && info !== null) {
    const sessionId = (info as Record<string, unknown>).sessionID
    if (typeof sessionId === "string") return sessionId
  }

  const sessionId = record.sessionID
  return typeof sessionId === "string" ? sessionId : undefined
}

export function isOpenCodeSessionComplete(
  event: NormalizedOpenCodeEvent,
  sessionId: string,
): boolean {
  if (event.type === "session.idle" || event.type === "session.compacted") {
    return getOpenCodeEventSessionId(event) === sessionId
  }

  if (event.type === "session.status") {
    const props = event.properties as { sessionID?: string; status?: { type?: string } }
    return props.sessionID === sessionId && props.status?.type === "idle"
  }

  return false
}

export class OpenCodeUIStreamConverter {
  private state: ConverterState = {
    textStarted: false,
    reasoningStarted: false,
    textContentByPart: new Map(),
    reasoningContentByPart: new Map(),
    toolStates: new Map(),
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      cachedInputTokens: 0,
      cachedWriteTokens: 0,
      totalCost: 0,
    },
    messageRoles: new Map(),
    permissionRequests: new Set(),
    questionRequests: new Set(),
  }

  constructor(private readonly writer: UIMessageStreamWriter) {}

  handle(event: NormalizedOpenCodeEvent): void {
    switch (event.type) {
      case "message.part.updated":
        this.handlePartUpdated(event)
        break
      case "message.part.delta":
        this.handlePartDelta(event)
        break
      case "message.updated":
        this.handleMessageUpdated(event)
        break
      case "session.error":
        this.handleSessionError(event)
        break
      default:
        break
    }
  }

  writePermissionRequest(options: {
    approvalId: string
    toolCallId: string
  }): void {
    if (this.state.permissionRequests.has(options.approvalId)) return
    this.state.permissionRequests.add(options.approvalId)
    this.writer.write({
      type: "tool-approval-request",
      approvalId: options.approvalId,
      toolCallId: options.toolCallId,
    })
  }

  writeQuestionError(questionId: string): void {
    if (this.state.questionRequests.has(questionId)) return
    this.state.questionRequests.add(questionId)
    this.writer.write({
      type: "error",
      errorText:
        `OpenCode asked an interactive question (${questionId}), which is not supported in this headless chat. ` +
        "The question was rejected so the run can continue or fail explicitly.",
    })
  }

  finish(finishReason: "stop" | "error" | "other" = "stop"): void {
    if (this.state.textStarted && this.state.textPartId) {
      this.writer.write({ type: "text-end", id: this.state.textPartId })
      this.state.textStarted = false
      this.state.textPartId = undefined
    }

    if (this.state.reasoningStarted && this.state.reasoningPartId) {
      this.writer.write({ type: "reasoning-end", id: this.state.reasoningPartId })
      this.state.reasoningStarted = false
      this.state.reasoningPartId = undefined
    }

    this.writer.write({
      type: "message-metadata",
      messageMetadata: {
        opencode: {
          ...(this.state.lastAssistantMessage?.id
            ? { messageId: this.state.lastAssistantMessage.id }
            : {}),
          usage: this.state.usage,
        },
      },
    })

    this.writer.write({ type: "finish", finishReason })
  }

  private handleMessageUpdated(event: NormalizedOpenCodeEvent): void {
    const info = (event.properties as { info?: Message }).info
    if (!info?.id) return

    this.state.messageRoles.set(info.id, info.role)
    if (info.role === "assistant") {
      this.state.lastAssistantMessage = info
    }
  }

  private handleSessionError(event: NormalizedOpenCodeEvent): void {
    const props = event.properties as { error?: { name?: string; data?: unknown } }
    const error = props.error
    this.writer.write({
      type: "error",
      errorText: error?.name
        ? `${error.name}: ${JSON.stringify(error.data ?? {})}`
        : "OpenCode session error",
    })
  }

  private handlePartUpdated(event: NormalizedOpenCodeEvent): void {
    const part = (event.properties as { part?: Part }).part
    const delta = (event.properties as { delta?: string }).delta
    if (!part) return

    if (this.state.messageRoles.get(part.messageID) === "user") return

    switch (part.type) {
      case "text":
        this.handleTextPart(part, delta)
        break
      case "reasoning":
        this.handleReasoningPart(part, delta)
        break
      case "tool":
        this.handleToolPart(part)
        break
      case "file":
        this.writeFileChunks(part)
        break
      case "step-finish":
        this.handleStepFinish(part)
        break
      default:
        break
    }
  }

  private handlePartDelta(event: NormalizedOpenCodeEvent): void {
    const props = event.properties as {
      partID?: string
      messageID?: string
      field?: string
      delta?: string
    }
    if (!props.partID || !props.messageID || !props.delta) return
    if (this.state.messageRoles.get(props.messageID) === "user") return

    const isReasoning =
      props.field === "reasoning" || this.state.reasoningPartId === props.partID

    if (isReasoning) {
      this.startReasoningPart(props.partID)
      this.writer.write({
        type: "reasoning-delta",
        id: props.partID,
        delta: props.delta,
      })
      this.state.reasoningContentByPart.set(
        props.partID,
        (this.state.reasoningContentByPart.get(props.partID) ?? "") + props.delta,
      )
      return
    }

    this.startTextPart(props.partID)
    this.writer.write({ type: "text-delta", id: props.partID, delta: props.delta })
    this.state.textContentByPart.set(
      props.partID,
      (this.state.textContentByPart.get(props.partID) ?? "") + props.delta,
    )
  }

  private handleTextPart(part: TextPart, delta: string | undefined): void {
    if (part.synthetic || part.ignored) return
    this.startTextPart(part.id)

    const existing = this.state.textContentByPart.get(part.id) ?? ""
    const nextDelta = delta ?? part.text.slice(existing.length)
    if (!nextDelta) return

    this.writer.write({ type: "text-delta", id: part.id, delta: nextDelta })
    this.state.textContentByPart.set(part.id, existing + nextDelta)
  }

  private handleReasoningPart(part: ReasoningPart, delta: string | undefined): void {
    this.startReasoningPart(part.id)

    const existing = this.state.reasoningContentByPart.get(part.id) ?? ""
    const nextDelta = delta ?? part.text.slice(existing.length)
    if (!nextDelta) return

    this.writer.write({ type: "reasoning-delta", id: part.id, delta: nextDelta })
    this.state.reasoningContentByPart.set(part.id, existing + nextDelta)
  }

  private handleToolPart(part: ToolPart): void {
    if (part.tool === STRUCTURED_OUTPUT_TOOL) {
      this.handleStructuredOutputTool(part)
      return
    }

    const callId = part.callID
    const toolName = part.tool
    const toolState = this.ensureToolState(callId, toolName)
    const state = part.state

    if (!toolState.inputStarted) {
      this.writer.write({
        type: "tool-input-start",
        toolCallId: callId,
        toolName,
        providerExecuted: true,
        dynamic: true,
        ...(state.status === "running" && state.title ? { title: state.title } : {}),
      })
      toolState.inputStarted = true
    }

    this.writeToolInputDelta(callId, state.input, toolState)

    if ((state.status === "completed" || state.status === "error") && !toolState.inputEmitted) {
      this.writer.write({
        type: "tool-input-available",
        toolCallId: callId,
        toolName,
        input: state.input,
        providerExecuted: true,
        dynamic: true,
        ...(state.status === "completed" && state.title ? { title: state.title } : {}),
      })
      toolState.inputEmitted = true
    }

    if (state.status === "completed" && !toolState.outputEmitted) {
      this.writer.write({
        type: "tool-output-available",
        toolCallId: callId,
        output: state.output,
        providerExecuted: true,
        dynamic: true,
      })
      toolState.outputEmitted = true

      for (const attachment of state.attachments ?? []) {
        const attachmentId = attachment.id ?? attachment.url
        if (toolState.emittedAttachmentIds.has(attachmentId)) continue
        this.writeFileChunks(attachment)
        toolState.emittedAttachmentIds.add(attachmentId)
      }
    }

    if (state.status === "error" && !toolState.outputEmitted) {
      this.writer.write({
        type: "tool-output-error",
        toolCallId: callId,
        errorText: state.error,
        providerExecuted: true,
        dynamic: true,
      })
      toolState.outputEmitted = true
      logger.warn("OpenCode tool failed", { toolName, callId, error: state.error })
    }
  }

  private handleStructuredOutputTool(part: ToolPart): void {
    const state = part.state
    if (state.status !== "completed") return

    const textId = `structured-output-${part.callID}`
    const text = safeStringify(state.input)
    this.startTextPart(textId)
    this.writer.write({ type: "text-delta", id: textId, delta: text })
    this.state.textContentByPart.set(textId, text)
  }

  private handleStepFinish(part: StepFinishPart): void {
    this.state.usage.inputTokens += part.tokens.input
    this.state.usage.outputTokens += part.tokens.output
    this.state.usage.reasoningTokens += part.tokens.reasoning
    this.state.usage.cachedInputTokens += part.tokens.cache.read
    this.state.usage.cachedWriteTokens += part.tokens.cache.write
    this.state.usage.totalCost += part.cost
  }

  private writeFileChunks(part: FilePart): void {
    for (const chunk of convertOpenCodeFilePartToUIChunks(part)) {
      this.writer.write(chunk)
    }
  }

  private startTextPart(partId: string): void {
    if (this.state.textStarted && this.state.textPartId === partId) return
    if (this.state.textStarted && this.state.textPartId) {
      this.writer.write({ type: "text-end", id: this.state.textPartId })
    }
    this.writer.write({ type: "text-start", id: partId })
    this.state.textStarted = true
    this.state.textPartId = partId
  }

  private startReasoningPart(partId: string): void {
    if (this.state.reasoningStarted && this.state.reasoningPartId === partId) return
    if (this.state.reasoningStarted && this.state.reasoningPartId) {
      this.writer.write({ type: "reasoning-end", id: this.state.reasoningPartId })
    }
    this.writer.write({ type: "reasoning-start", id: partId })
    this.state.reasoningStarted = true
    this.state.reasoningPartId = partId
  }

  private ensureToolState(callId: string, toolName: string): ToolStreamState {
    const existing = this.state.toolStates.get(callId)
    if (existing) return existing

    const created: ToolStreamState = {
      toolName,
      inputStarted: false,
      inputEmitted: false,
      outputEmitted: false,
      emittedAttachmentIds: new Set(),
    }
    this.state.toolStates.set(callId, created)
    return created
  }

  private writeToolInputDelta(
    toolCallId: string,
    input: unknown,
    state: ToolStreamState,
  ): void {
    const inputText = safeStringify(input)
    if (!inputText || inputText === state.lastInputText) return

    const delta = state.lastInputText && inputText.startsWith(state.lastInputText)
      ? inputText.slice(state.lastInputText.length)
      : inputText

    if (delta) {
      this.writer.write({
        type: "tool-input-delta",
        toolCallId,
        inputTextDelta: delta,
      })
    }

    state.lastInputText = inputText
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "{}"
  } catch {
    return "{}"
  }
}
