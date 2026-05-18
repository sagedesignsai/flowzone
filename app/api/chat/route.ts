/**
 * POST /api/chat
 *
 * Streaming chat completion endpoint using the Flowzone agent.
 * Uses createAgentUIStreamResponse for proper UIMessage stream format
 * compatible with useChat from @ai-sdk/react.
 *
 * Request body:
 *   { messages: UIMessage[], id?: string }
 *
 * Response:
 *   SSE stream of UI message chunks
 *   500 { error: string } if no AI provider configured
 */

import { createAgentUIStreamResponse } from "ai"
import { createFlowzoneAgent } from "@/lib/agents/flowzone-agent"
import { SandboxContext } from "@/lib/tools/sandbox-store"
import type { SandboxContextValue } from "@/lib/tools/sandbox-store"
import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"

// ── Provider selection ─────────────────────────────────────

function getModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-sonnet-4-20250514")
  }

  if (process.env.OPENAI_API_KEY) {
    return openai("gpt-4o")
  }

  return null
}

// ── Optional sandbox creation ──────────────────────────────

async function tryCreateSandbox(): Promise<SandboxContextValue | null> {
  if (!process.env.E2B_API_KEY) return null

  try {
    // Dynamic import to avoid loading e2b when not configured
    const { Sandbox } = await import("e2b")
    const sandbox = await Sandbox.create()
    return { sandbox }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn("Failed to create E2B sandbox:", message)
    return null
  }
}

// ── Route handler ──────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const model = getModel()

    if (!model) {
      return Response.json(
        {
          error:
            "No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment.",
        },
        { status: 500 },
      )
    }

    const { messages } = (await req.json()) as {
      messages: unknown[]
      id?: string
    }

    const agent = createFlowzoneAgent(model)

    // Try to create a sandbox for this session (optional)
    const sandboxCtx = await tryCreateSandbox()

    if (sandboxCtx) {
      return SandboxContext.run(sandboxCtx, () =>
        createAgentUIStreamResponse({
          agent,
          uiMessages: messages,
        }),
      )
    }

    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/chat error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
