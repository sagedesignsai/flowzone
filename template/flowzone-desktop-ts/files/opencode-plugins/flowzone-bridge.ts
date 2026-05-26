import { type Plugin, tool } from "@opencode-ai/plugin"

interface PostBridgeOptions {
  path: string
  payload: Record<string, unknown>
}

export const FlowzoneBridge: Plugin = async ({ $ }) => {
  const apiUrl = process.env.FLOWZONE_API_URL ?? ""
  const chatId = process.env.FLOWZONE_CHAT_ID ?? ""

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

    tool: {
      flowzone_push: tool({
        description:
          "Commit all local changes and push to the remote repository. " +
          "Uses git credentials injected by the environment.",
        args: {
          commitMessage: tool.schema
            .string()
            .describe("Commit message describing the changes"),
        },
        async execute(args: { commitMessage: string }) {
          const { commitMessage } = args
          await $`git add -A`
          const diffExit = await $`git diff --cached --quiet`.nothrow()
          if (diffExit.exitCode === 0) {
            return "No changes to commit"
          }
          await $`git commit -m ${commitMessage}`
          await $`git push origin HEAD`
          await postBridge("/api/opencode/status", {
            status: "finished",
            message: `Pushed: ${commitMessage}`,
          })
          return "Changes pushed successfully."
        },
      }),

      flowzone_get_context: tool({
        description:
          "Fetch project context and instructions from the Flowzone platform. " +
          "Use this to understand the current task, project requirements, or " +
          "get updated instructions.",
        args: {},
        async execute() {
          if (!apiUrl) return "Flowzone API URL not configured"
          try {
            const res = await fetch(`${apiUrl}/api/opencode/context`, {
              headers: { "x-chat-id": chatId },
            })
            if (!res.ok) {
              return `Failed to fetch context: ${res.status} ${res.statusText}`
            }
            const data = await res.json()
            return JSON.stringify(data, null, 2)
          } catch (err) {
            return `Error fetching context: ${err instanceof Error ? err.message : String(err)}`
          }
        },
      }),

      flowzone_create_pr: tool({
        description:
          "Create a pull request on GitHub through the Flowzone platform. " +
          "Use this after pushing changes to create a PR with a title and description.",
        args: {
          title: tool.schema
            .string()
            .describe("Pull request title"),
          body: tool.schema
            .string()
            .describe("Pull request description / body"),
          head: tool.schema
            .string()
            .describe("Source branch name (defaults to current branch)")
            .optional(),
          base: tool.schema
            .string()
            .describe("Target branch name (defaults to repository default)")
            .optional(),
        },
        async execute(args: { title: string; body: string; head?: string; base?: string }) {
          const { title, body, head, base } = args
          if (!apiUrl) return "Flowzone API URL not configured"
          try {
            const res = await fetch(`${apiUrl}/api/opencode/pr`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId, title, body, head, base }),
            })
            if (!res.ok) {
              return `Failed to create PR: ${res.status} ${res.statusText}`
            }
            const data = await res.json()
            return `Pull request created: ${data.html_url ?? data.url ?? "unknown URL"}`
          } catch (err) {
            return `Error creating PR: ${err instanceof Error ? err.message : String(err)}`
          }
        },
      }),

      flowzone_get_status: tool({
        description:
          "Get the current sandbox status and environment information. " +
          "Reports git branch, repo status, and Flowzone connection health.",
        args: {},
        async execute() {
          const branch = await $`git branch --show-current`.nothrow()
          const remote = await $`git remote get-url origin`.nothrow()
          const status = await $`git status --short`.nothrow()
          const connected = apiUrl ? "connected" : "not configured"

          return [
            `## Sandbox Status`,
            ``,
            `- **Flowzone**: ${connected}${apiUrl ? ` (${apiUrl})` : ""}`,
            `- **Chat ID**: ${chatId || "none"}`,
            `- **Branch**: ${branch.stdout?.trim() || "unknown"}`,
            `- **Remote**: ${remote.stdout?.trim() || "none"}`,
            `- **Git Status**:`,
            status.stdout?.trim() || "  (clean working tree)",
          ].join("\n")
        },
      }),
    },
  }
}
