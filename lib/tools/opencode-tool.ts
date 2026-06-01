/**
 * OpenCode Tool
 *
 * A tool that submits development prompts to OpenCode and streams
 * the response as preliminary tool results. This is the primary
 * tool used by the Virtual Developer agent.
 */

import { tool, createUIMessageStream, readUIMessageStream } from "ai"
import { z } from "zod"
import { resolveOpenCodeSession } from "@/lib/opencode-sandbox/session"
import { executeOpenCodePrompt } from "@/lib/opencode-sandbox/stream-prompt"
import { createOpenCodeManager } from "@/lib/opencode-sandbox/manager"
import { SandboxContext } from "@/lib/tools/sandbox-store"

export function createSubmitToOpenCodeTool() {
  return tool({
    description: [
      "Submit a development task or question to OpenCode — the AI coding engine.",
      "This is your PRIMARY tool for all development work.",
      "Use it when the user asks you to write code, create files, modify existing",
      "code, run development commands, or answer technical questions.",
      "",
      "OpenCode will generate code, write files, run commands, and return results.",
      "After OpenCode completes, you may verify the work using other tools",
      "(runShellCommand, takeScreenshot, launchApp) if a desktop sandbox is available.",
    ].join("\n"),
    inputSchema: z.object({
      prompt: z
        .string()
        .describe(
          "The development task or question to send to OpenCode. " +
            "Include all relevant context, file paths, and requirements.",
        ),
    }),
    execute: async function* ({ prompt }, { abortSignal }) {
      const ctx = SandboxContext.get()
      if (!ctx?.sandbox) {
        throw new Error(
          "No development sandbox available. Cannot run OpenCode.",
        )
      }

      if (!ctx.chatId) {
        throw new Error("No chat ID available in sandbox context.")
      }

      const opencode = await createOpenCodeManager(ctx.sandbox)

      const { sessionId } = await resolveOpenCodeSession(
        opencode.client,
        ctx.chatId,
      )

      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          await executeOpenCodePrompt({
            client: opencode.client,
            sessionId,
            promptText: prompt,
            writer,
            abortSignal,
          })
        },
      })

      for await (const message of readUIMessageStream({ stream })) {
        yield message
      }
    },
    toModelOutput: ({ output: message }) => {
      const lastTextPart = message?.parts?.findLast
        ? message.parts.findLast((p: { type: string }) => p.type === "text")
        : undefined
      const lastTextPartAlt =
        !lastTextPart && message?.parts
          ? [...message.parts].reverse().find((p: { type: string }) => p.type === "text")
          : lastTextPart

      const text = lastTextPartAlt
        ? (lastTextPartAlt as { text?: string }).text ?? ""
        : ""

      const summary = text
        ? text.length > 1000
          ? text.slice(0, 1000) + "..."
          : text
        : "OpenCode completed the task."

      return {
        type: "text",
        value: summary,
      }
    },
  })
}
