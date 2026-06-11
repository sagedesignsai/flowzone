import type { UIMessage } from "ai"
import type {
  Part,
  TextPart as OpenCodeTextPart,
  ToolPart,
  ReasoningPart,
  FilePart,
} from "@opencode-ai/sdk/v2"

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
        uiParts.push({ type: "reasoning", text: p.text, state: "done" })
        break
      }
      case "tool": {
        const p = part as ToolPart
        const state = p.state
        if (state.status === "pending" || state.status === "running") {
          uiParts.push({
            type: "dynamic-tool",
            toolCallId: p.callID,
            toolName: p.tool,
            input: state.input,
            state: "input-streaming",
          })
        } else if (state.status === "completed") {
          uiParts.push({
            type: "dynamic-tool",
            toolCallId: p.callID,
            toolName: p.tool,
            input: state.input,
            state: "output-available",
            output: state.output,
          })
        } else if (state.status === "error") {
          uiParts.push({
            type: "dynamic-tool",
            toolCallId: p.callID,
            toolName: p.tool,
            input: state.input,
            state: "output-error",
            errorText: state.error,
          })
        }
        break
      }
      case "file": {
        const p = part as FilePart
        uiParts.push({
          type: "file",
          url: p.url,
          mediaType: p.mime,
          ...(p.filename ? { filename: p.filename } : {}),
        })
        break
      }
    }
  }

  return uiParts
}
