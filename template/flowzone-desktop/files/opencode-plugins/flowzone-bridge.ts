/**
 * Flowzone Bridge — OpenCode Plugin
 *
 * Bridges the OpenCode sandbox session back to the Flowzone platform.
 * Subscribes to session lifecycle events, injects git credentials,
 * and provides a git push tool.
 *
 * Events subscribed:
 *   - session.created → POST /api/opencode/status (started)
 *   - session.idle    → POST /api/opencode/status (idle)
 *   - session.error   → POST /api/opencode/error
 *   - shell.env       → inject GIT_AUTHOR_NAME, GIT_AUTHOR_EMAIL, GH_TOKEN
 *   - tool.flowzone_push → git add/commit/push, optional PR creation
 *
 * This file is baked into the flowzone-desktop template at build time.
 * Source: template/flowzone-desktop/files/opencode-plugins/flowzone-bridge.ts
 */

import { type Plugin, tool } from "@opencode-ai/plugin"

export const FlowzoneBridge: Plugin = async ({ $ }) => {
  const apiUrl = process.env.FLOWZONE_API_URL ?? ""
  const chatId = process.env.FLOWZONE_CHAT_ID ?? ""

  /**
   * Fire-and-forget POST to the Flowzone platform.
   * Errors are silently caught — never block OpenCode for a bridge call.
   */
  async function postBridge(path: string, payload: Record<string, unknown>) {
    if (!apiUrl) return
    try {
      await fetch(`${apiUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, ...payload }),
      })
    } catch {
      // fire-and-forget
    }
  }

  return {
    // ── Shell Environment ─────────────────────────────────
    // Inject git credentials into every shell the agent spawns.
    "shell.env": async (
      _input: { cwd: string },
      output: { env: Record<string, string> },
    ) => {
      if (process.env.GIT_AUTHOR_NAME) {
        output.env.GIT_AUTHOR_NAME = process.env.GIT_AUTHOR_NAME
      }
      if (process.env.GIT_AUTHOR_EMAIL) {
        output.env.GIT_AUTHOR_EMAIL = process.env.GIT_AUTHOR_EMAIL
      }
      if (process.env.GITHUB_TOKEN) {
        output.env.GH_TOKEN = process.env.GITHUB_TOKEN
      }
    },

    // ── Session Lifecycle Events ──────────────────────────
    // Bridge session state changes back to the Flowzone platform.
    event: async ({ event }: { event: { type: string; error?: Error } }) => {
      const ts = new Date().toISOString()

      if (event.type === "session.created") {
        await postBridge("/api/opencode/status", {
          status: "started",
          timestamp: ts,
        })
      }

      if (event.type === "session.idle") {
        await postBridge("/api/opencode/status", {
          status: "idle",
          timestamp: ts,
        })
      }

      if (event.type === "session.error") {
        await postBridge("/api/opencode/error", {
          error: event.error?.message ?? "Unknown error",
          timestamp: ts,
        })
      }
    },

    // ── Custom Tools ──────────────────────────────────────
    // Git push tool available to the OpenCode agent.
    tool: {
      flowzone_push: tool({
        description:
          "Commit all local changes and push to the remote repository. " +
          "Uses git credentials injected by the environment. " +
          "PRs are created manually through the Flowzone UI.",
        args: {
          commitMessage: tool.schema
            .string()
            .describe("Commit message describing the changes"),
        },
        async execute(args: { commitMessage: string }) {
          const { commitMessage } = args

          // Stage everything
          await $`git add -A`

          // Check if there's anything to commit
          const diffExit = await $`git diff --cached --quiet`.nothrow()
          if (diffExit.exitCode === 0) {
            return "No changes to commit"
          }

          // Commit
          await $`git commit -m ${commitMessage}`

          // Push (GH_TOKEN may have been injected via shell.env)
          await $`git push origin HEAD`

          await postBridge("/api/opencode/status", {
            status: "finished",
            message: `Pushed: ${commitMessage}`,
          })

          return "Changes pushed successfully."
        },
      }),
    },
  }
}
