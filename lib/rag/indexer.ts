/**
 * RAG Indexing Pipeline
 *
 * Ingests text content into the vector store: chunk → embed → upsert.
 * This is the "write" side of the RAG pipeline.
 *
 * @see lib/rag/chunk.ts      — Text chunking
 * @see lib/rag/embeddings.ts — Cohere embedding
 * @see lib/rag/qdrant.ts     — Qdrant storage
 */

import { getQdrantClient, ensureCollection, getCollectionName } from "./qdrant"
import { embedDocuments } from "./embeddings"
import { chunkText } from "./chunk"
import type { ChunkingStrategy, ChunkingOptions } from "./chunk"
import { logger } from "@/lib/logger"

// ─── Types ──────────────────────────────────────────────────

export interface IndexOptions {
  /** Chunking strategy to use */
  strategy?: ChunkingStrategy
  /** Chunking options (maxSize, overlap) */
  chunking?: ChunkingOptions
}

export interface IndexResult {
  success: boolean
  chunksIndexed: number
  error?: string
}

export interface IndexableSource {
  /** The text content to index */
  content: string
  /** Source label (filename, URL, etc.) */
  source: string
}

// ─── Indexing ───────────────────────────────────────────────

/**
 * Index a single text string into the knowledge base.
 * Chunks, embeds, and upserts into Qdrant.
 */
export async function indexText(
  text: string,
  source: string = "unknown",
  options: IndexOptions = {},
): Promise<IndexResult> {
  const client = getQdrantClient()
  if (!client) {
    return { success: false, chunksIndexed: 0, error: "Qdrant not configured" }
  }

  await ensureCollection()

  const chunks = chunkText(text, options.strategy, options.chunking)
  if (chunks.length === 0) {
    return { success: true, chunksIndexed: 0 }
  }

  const chunkTexts = chunks.map((c) => c.content)
  const embedded = await embedDocuments(chunkTexts)

  const points = embedded.map((e, i) => ({
    id: crypto.randomUUID(),
    vector: e.embedding,
    payload: {
      content: e.content,
      source,
      startIndex: chunks[i].startIndex,
      endIndex: chunks[i].endIndex,
      indexedAt: new Date().toISOString(),
    },
  }))

  try {
    await client.upsert(getCollectionName(), {
      wait: true,
      points,
    })

    logger.info("Indexed chunks into Qdrant", {
      source,
      chunks: points.length,
    })

    return { success: true, chunksIndexed: points.length }
  } catch (error) {
    const message = String(error)
    logger.error("Failed to index chunks", { source, error: message })
    return { success: false, chunksIndexed: 0, error: message }
  }
}

/**
 * Index multiple text sources into the knowledge base.
 */
export async function indexSources(
  sources: IndexableSource[],
  options: IndexOptions = {},
): Promise<IndexResult> {
  let totalIndexed = 0

  for (const source of sources) {
    const result = await indexText(source.content, source.source, options)
    if (!result.success) {
      return result
    }
    totalIndexed += result.chunksIndexed
  }

  return { success: true, chunksIndexed: totalIndexed }
}
