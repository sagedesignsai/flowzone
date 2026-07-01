/**
 * RAG AI SDK Tools
 *
 * AI SDK tools that let agents query and add to the knowledge base.
 * Designed to plug into the existing tool system at /lib/tools/.
 *
 * Usage from an agent:
 *   import { createKnowledgeTools } from "@/lib/rag/tools"
 *   const tools = { ...otherTools, ...createKnowledgeTools() }
 */

import { tool } from "ai"
import { z } from "zod"
import { searchKnowledge, formatRetrievedContext } from "@/lib/rag/retrieve"
import { indexText } from "@/lib/rag/index"
import { isQdrantConfigured } from "@/lib/rag/qdrant"
import { isEmbeddingConfigured } from "@/lib/rag/embeddings"
import type { RetrievedChunk } from "@/lib/rag/retrieve"

// ─── Tools ──────────────────────────────────────────────────

/**
 * Create RAG knowledge base tools for an AI agent.
 *
 * Returns:
 *  - searchKnowledge: semantic search across the vector store
 *  - addKnowledge: add content to the vector store
 */
export function createKnowledgeTools() {
  const configured = isQdrantConfigured() && isEmbeddingConfigured()

  if (!configured) {
    return {}
  }

  return {
    searchKnowledge: tool({
      description: [
        "Search the knowledge base for information relevant to the user's question.",
        "Use this to find previously stored context, project details, or past conversations.",
        "Returns the most semantically relevant content with source citations.",
      ].join(" "),
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "The search query — be specific for best results. Use natural language.",
          ),
        limit: z
          .number()
          .optional()
          .default(5)
          .describe("Maximum number of results to return (1-20)"),
      }),
      execute: async ({
        query,
        limit,
      }: {
        query: string
        limit?: number
      }) => {
        const results = await searchKnowledge(query, {
          limit: Math.min(limit ?? 5, 20),
          rerank: true,
          rerankTopN: Math.min(limit ?? 5, 10),
        })

        if (results.length === 0) {
          return {
            found: false,
            message: "No relevant information found in the knowledge base.",
            context: "",
            results: [],
          }
        }

        return {
          found: true,
          totalResults: results.length,
          context: formatRetrievedContext(results),
          results: results.map(
            (r: RetrievedChunk) => ({
              content: r.content,
              source: r.source,
              score: r.score,
            }),
          ),
        }
      },
    }),

    addKnowledge: tool({
      description: [
        "Add new information to the knowledge base so it can be recalled later.",
        "Use this when the user shares facts, preferences, project context,",
        "or any information that should be remembered across conversations.",
      ].join(" "),
      inputSchema: z.object({
        content: z
          .string()
          .describe(
            "The information to store. Be detailed and specific for better retrieval.",
          ),
        source: z
          .string()
          .optional()
          .default("user-input")
          .describe("Optional label identifying where this came from."),
      }),
      execute: async ({
        content,
        source,
      }: {
        content: string
        source?: string
      }) => {
        const result = await indexText(content, source ?? "user-input")

        if (result.success) {
          return {
            stored: true,
            message: `Stored ${result.chunksIndexed} chunk(s) in the knowledge base.`,
            chunksIndexed: result.chunksIndexed,
          }
        }

        return {
          stored: false,
          message:
            "Failed to store information. The knowledge base may not be configured.",
        }
      },
    }),
  }
}
