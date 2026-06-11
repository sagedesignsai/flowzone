import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { loadChat } from "@/lib/chat/store"
import { getFastModel } from "@/lib/ai/models"
import { generateText, tool } from "ai"
import { z } from "zod"

/**
 * POST /api/workspace/desktop/[id]/title
 *
 * Generates a concise title for a chat based on its history.
 * Uses a tool call for reliable structured output — the model
 * calls a `generateTitle` tool with a guaranteed schema.
 *
 * Uses the fast/cheap model since this is a simple task.
 *
 * Response:
 *   200 { title: string }
 *   401 { error: "Unauthorized" }
 *   403 { error: "Forbidden" }
 *   404 { error: "Chat not found" }
 *   500 { error: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 1. Verify authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 2. Verify chat ownership
    const chat = await prisma.chat.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 3. Load messages to generate title from
    const messages = await loadChat(id)
    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Cannot generate title for empty chat" },
        { status: 400 }
      )
    }

    // Format history for the prompt (first few messages)
    const historyText = messages
      .slice(0, 4)
      .map((m) => {
        const text = m.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ")
        return `${m.role}: ${text}`
      })
      .join("\n\n")

    // 4. Check if we have an AI model configured
    const model = getFastModel()
    if (!model) {
      return NextResponse.json(
        { error: "No AI provider configured for title generation" },
        { status: 500 }
      )
    }

    // 5. Generate the title via a tool call for guaranteed structured output.
    //    The model exercises its tool-calling ability to produce a clean title.
    const { toolCalls } = await generateText({
      model,
      system: [
        "You are a helpful assistant that generates extremely concise, descriptive titles for chat conversations.",
        "When the user describes a conversation, call the `generateTitle` tool with a title that is 3 to 5 words long.",
        "The title should sound like a feature or project name. No quotes, no punctuation at the end.",
      ].join("\n"),
      prompt: `Generate a title for this conversation:\n\n${historyText}`,
      temperature: 0.3,
      tools: {
        generateTitle: tool({
          description:
            "Generate a concise 3-to-5-word title for a conversation",
          inputSchema: z.object({
            title: z
              .string()
              .describe(
                "A 3-to-5-word title describing the conversation topic"
              ),
          }),
        }),
      },
      toolChoice: { type: "tool", toolName: "generateTitle" },
    })

    const firstToolCall = toolCalls?.[0]
    if (
      !firstToolCall?.input ||
      typeof firstToolCall.input !== "object"
    ) {
      return NextResponse.json(
        { error: "Failed to generate title" },
        { status: 500 }
      )
    }

    const cleanTitle = String(
      (firstToolCall.input as { title: string }).title
    ).trim()

    // 6. Update the database
    await prisma.chat.update({
      where: { id },
      data: { title: cleanTitle },
    })

    return NextResponse.json({ title: cleanTitle })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate title"
    console.error("POST /api/workspace/desktop/[id]/title error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
