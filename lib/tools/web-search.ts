import { tool } from "ai"
import { z } from "zod"
import { searchWeb } from "@/lib/search/web"

export function createWebSearchTool() {
  return tool({
    description: [
      "Search the web for up-to-date information.",
      "Use when the user enabled web search or asks about recent events, documentation, or facts outside the codebase.",
    ].join(" "),
    inputSchema: z.object({
      query: z.string().describe("The search query"),
    }),
    execute: async ({ query }) => {
      const response = await searchWeb(query)
      return {
        query: response.query,
        results: response.results,
        summary: response.results
          .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`)
          .join("\n\n"),
      }
    },
  })
}
