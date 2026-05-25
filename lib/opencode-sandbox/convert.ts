import type { UIMessage } from "ai"
import type {
  Part,
  TextPart as OpenCodeTextPart,
  ToolPart,
  ReasoningPart,
} from "@opencode-ai/sdk"

export function convertOpenCodePartsToUIMessageParts(
  parts: Part[],
): UIMessage["parts"] {
  const uiParts: UIMessage["parts"] = []

  for (const part of parts) {
    switch (part.type) {
      case "text": {
        const p = part as OpenCodeTextPart
        uiParts.push({ type: "text", text: p.text })
        break
      }
      case "reasoning": {
        const p = part as ReasoningPart
        uiParts.push({ type: "reasoning", reasoning: p.text, details: [] })
        break
      }
      case "tool": {
        const p = part as ToolPart
        const state = p.state
        const toolState =
          state.status === "completed"
            ? "result"
            : state.status === "error"
              ? "error"
              : "call"
        uiParts.push({
          type: "tool-invocation",
          toolInvocation: {
            toolCallId: p.callID,
            toolName: p.tool,
            state: toolState,
            args: state.input,
            ...(state.status === "completed" ? { result: state.output } : {}),
            ...(state.status === "error" ? { error: state.error } : {}),
          },
        })
        break
      }
    }
  }

  return uiParts
}
