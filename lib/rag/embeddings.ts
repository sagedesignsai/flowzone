/**
 * Cohere Embedding via AI SDK
 *
 * Uses the AI SDK's Cohere provider to generate embeddings.
 * Supports both single and batch embedding.
 *
 * IMPORTANT: Cohere's embedding API requires the `inputType` parameter:
 *   - "search_document" for indexing (storing documents)
 *   - "search_query" for retrieval (searching)
 *
 * @see https://ai-sdk.dev/providers/ai-sdk-providers/cohere
 * @see https://ai-sdk.dev/docs/ai-sdk-core/embeddings
 */

import { embed, embedMany } from "ai"
import { cohere, type CohereEmbeddingModelOptions } from "@ai-sdk/cohere"
import { logger } from "@/lib/logger"

// ─── Configuration ──────────────────────────────────────────

const EMBEDDING_MODEL = "embed-english-v3.0"

export const EMBEDDING_DIMENSIONS = 1024

// ─── Types ──────────────────────────────────────────────────

export interface EmbeddingResult {
  /** The original input text */
  content: string
  /** The embedding vector */
  embedding: number[]
}

// ─── Embedding Functions ────────────────────────────────────

/**
 * Generate a single embedding vector for a query string.
 * Uses inputType "search_query" for retrieval.
 */
export async function embedQuery(text: string): Promise<number[]> {
  const cleanText = text.replaceAll("\\n", " ").trim()

  if (!cleanText) {
    throw new Error("Cannot embed empty text")
  }

  const { embedding } = await embed({
    model: cohere.embedding(EMBEDDING_MODEL),
    value: cleanText,
    providerOptions: {
      cohere: {
        inputType: "search_query",
      } satisfies CohereEmbeddingModelOptions,
    },
  })

  return embedding
}

/**
 * Generate embeddings for multiple text chunks (for indexing).
 * Uses inputType "search_document" for storage.
 */
export async function embedDocuments(
  chunks: string[],
): Promise<EmbeddingResult[]> {
  if (chunks.length === 0) return []

  const cleanChunks = chunks.map((c) => c.replaceAll("\\n", " ").trim())

  const { embeddings } = await embedMany({
    model: cohere.embedding(EMBEDDING_MODEL),
    values: cleanChunks,
    providerOptions: {
      cohere: {
        inputType: "search_document",
      } satisfies CohereEmbeddingModelOptions,
    },
  })

  return cleanChunks.map((content, i) => ({
    content,
    embedding: embeddings[i],
  }))
}

/**
 * Generate a single embedding for a document (for indexing individual chunks).
 * Uses inputType "search_document" for storage.
 */
export async function embedDocument(text: string): Promise<number[]> {
  const cleanText = text.replaceAll("\\n", " ").trim()

  if (!cleanText) {
    throw new Error("Cannot embed empty text")
  }

  const { embedding } = await embed({
    model: cohere.embedding(EMBEDDING_MODEL),
    value: cleanText,
    providerOptions: {
      cohere: {
        inputType: "search_document",
      } satisfies CohereEmbeddingModelOptions,
    },
  })

  return embedding
}

/**
 * Check if Cohere embeddings are configured (API key present).
 */
export function isEmbeddingConfigured(): boolean {
  return Boolean(process.env.COHERE_API_KEY)
}
