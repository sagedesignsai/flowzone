/**
 * POST /api/desktop   — Create a new desktop sandbox and start VNC stream
 * DELETE /api/desktop — Kill an existing desktop sandbox
 *
 * The desktop sandbox uses @e2b/desktop which provides a full Linux GUI
 * environment with VNC streaming via noVNC.
 */

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const maxDuration = 60

// ── POST — Create sandbox + start VNC stream ───────────────

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.E2B_API_KEY) {
      return Response.json(
        { error: "E2B_API_KEY is not configured" },
        { status: 500 },
      )
    }

    const { chatId, projectId } = await req.json()

    // Dynamic import — avoids loading @e2b/desktop when not configured
    const { Sandbox } = await import("@e2b/desktop")

    const timeoutMs = Number(process.env.E2B_DESKTOP_TIMEOUT_MS ?? 300000)

    const template = process.env.E2B_DESKTOP_TEMPLATE ?? "flowzone-desktop"
    const desktop = await Sandbox.create(template, {
      resolution: [1280, 800],
      dpi: 96,
      timeoutMs,
      envs: {
        FLOWZONE_API_URL: process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",
        FLOWZONE_CHAT_ID: chatId ?? "",
        FLOWZONE_PROJECT_ID: projectId ?? "",
        GITHUB_TOKEN: process.env.GITHUB_TOKEN ?? "",
        GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME ?? session.user.name ?? "",
        GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL ?? session.user.email ?? "",
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
      },
      metadata: {
        userId: session.user.id,
        projectId: projectId ?? "",
        chatId: chatId ?? "",
      },
    })

    await desktop.stream.start()

    const vncUrl = desktop.stream.getUrl()

    return Response.json({ sandboxId: desktop.sandboxId, vncUrl })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/desktop error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}

// ── DELETE — Kill an existing sandbox ─────────────────────

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sandboxId } = await req.json()

    if (!sandboxId) {
      return Response.json(
        { error: "sandboxId is required" },
        { status: 400 },
      )
    }

    // Dynamic import — avoids loading @e2b/desktop when not configured
    const { Sandbox } = await import("@e2b/desktop")

    const desktop = await Sandbox.connect(sandboxId)

    await desktop.kill()

    return Response.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("DELETE /api/desktop error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
