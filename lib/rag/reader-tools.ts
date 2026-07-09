/**
 * Document Reader AI SDK Tools
 *
 * AI SDK tools that let agents read and ingest documents.
 * These work independently of the RAG pipeline configuration
 * (they don't need Qdrant/Cohere to be available — they're always on).
 *
 * Usage from an agent:
 *   import { createReaderTools } from "@/lib/rag/reader-tools"
 *   const tools = { ...otherTools, ...createReaderTools() }
 */

import { tool } from "ai"
import { z } from "zod"
import { parseDocument, readDocumentFile, parseAndIngest, readAndIngest } from "./reader"
import { isQdrantConfigured } from "./qdrant"
import { isEmbeddingConfigured } from "./embeddings"
import { logger } from "@/lib/logger"

// ─── Tools ──────────────────────────────────────────────────

/**
 * Create document reader and ingestion tools for an AI agent.
 *
 * Returns:
 *  - readDocument: parse a document from the filesystem into text/markdown
 *  - ingestDocument: parse a document and index it into the knowledge base
 */
export function createReaderTools() {
  const ragConfigured = isQdrantConfigured() && isEmbeddingConfigured()

  return {
    readDocument: tool({
      description: [
        "Read and parse a document file. Supports PDF, Word (.docx), Excel (.xlsx),",
        "PowerPoint (.pptx), Markdown (.md), CSV, RTF, HTML, and plain text (.txt).",
        "Returns the document content as clean text or markdown that the agent can read.",
        "Use this when the user shares a file or asks about a document's contents.",
      ].join(" "),
      inputSchema: z.object({
        path: z
          .string()
          .describe(
            "Path to the document file on the filesystem (e.g., /path/to/report.pdf)",
          ),
        format: z
          .enum(["text", "markdown"])
          .optional()
          .default("markdown")
          .describe("Output format: 'markdown' (default) or 'text'"),
      }),
      execute: async ({
        path,
        format,
      }: {
        path: string
        format?: "text" | "markdown"
      }) => {
        try {
          const result = await readDocumentFile(path, {
            format: format ?? "markdown",
          })

          // Truncate if content is very long to avoid context overflow
          const maxLength = 15000
          const truncated =
            result.content.length > maxLength
              ? result.content.slice(0, maxLength) +
                `\n\n[... content truncated at ${maxLength} chars, total ${result.content.length} chars]`
              : result.content

          return {
            success: true,
            fileName: path.split("/").pop() ?? path,
            fileType: result.format,
            content: truncated,
            metadata: result.metadata,
            pageCount: result.pageCount,
            totalLength: result.content.length,
            truncated: result.content.length > maxLength,
          }
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to read document",
          }
        }
      },
    }),

    ...(ragConfigured
      ? {
          ingestDocument: tool({
            description: [
              "Parse a document and store its content in the knowledge base for future reference.",
              "Supports PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Markdown (.md),",
              "CSV, RTF, HTML, and plain text (.txt).",
              "Once ingested, the information can be retrieved later via searchKnowledge.",
              "Use this when the user asks you to save, remember, or learn from a document.",
            ].join(" "),
            inputSchema: z.object({
              path: z
                .string()
                .describe(
                  "Path to the document file on the filesystem (e.g., /path/to/document.pdf)",
                ),
              sourceLabel: z
                .string()
                .optional()
                .describe(
                  "Optional label for the source (defaults to the filename)",
                ),
            }),
            execute: async ({
              path,
              sourceLabel,
            }: {
              path: string
              sourceLabel?: string
            }) => {
              try {
                const fileName = path.split("/").pop() ?? path
                const result = await readAndIngest(path, {
                  source: sourceLabel ?? fileName,
                  returnContent: false,
                })

                if (!result.ingested) {
                  return {
                    success: false,
                    error: result.error ?? "Failed to ingest document",
                  }
                }

                return {
                  success: true,
                  fileName,
                  chunksIndexed: result.chunksIndexed,
                  message: `Successfully ingested "${fileName}" (${result.chunksIndexed} chunk(s) stored in the knowledge base).`,
                }
              } catch (error) {
                return {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to ingest document",
                }
              }
            },
          }),
        }
      : {}),
  }
}
