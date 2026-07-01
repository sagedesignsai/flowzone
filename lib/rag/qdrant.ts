/**
 * Qdrant Vector Database Client
 *
 * Singleton client for the Qdrant cloud instance.
 * Provides collection management helpers for RAG workflows.
 */

import { QdrantClient } from "@qdrant/js-client-rest"
import { logger } from "@/lib/logger"

// ─── Configuration ──────────────────────────────────────────

const QDRANT_URL = process.env.QDRANT_URL
const QDRANT_API_KEY = process.env.QDRANT_API_KEY

const COLLECTION_NAME = "flowzone_knowledge"

/** Cohere embed-english-v3.0 produces 1024-dimensional vectors */
const VECTOR_SIZE = 1024
const DISTANCE: "Cosine" = "Cosine"

// ─── Singleton ──────────────────────────────────────────────

let _client: QdrantClient | null = null

/**
 * Get or create the singleton Qdrant client.
 * Returns null if Qdrant is not configured.
 */
export function getQdrantClient(): QdrantClient | null {
  if (_client) return _client

  if (!QDRANT_URL || !QDRANT_API_KEY) {
    logger.warn(
      "Qdrant not configured: set QDRANT_URL and QDRANT_API_KEY env vars",
    )
    return null
  }

  _client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
  })

  return _client
}

// ─── Collection Management ──────────────────────────────────

export interface CollectionStats {
  name: string
  pointsCount: number
  vectorsCount: number
  status: string
}

/**
 * Get the RAG knowledge collection name.
 */
export function getCollectionName(): string {
  return COLLECTION_NAME
}

/**
 * Ensure the knowledge collection exists, creating it if needed.
 * Idempotent — safe to call on every startup.
 */
export async function ensureCollection(): Promise<boolean> {
  const client = getQdrantClient()
  if (!client) return false

  try {
    const collections = await client.getCollections()
    const exists = collections.collections?.some(
      (c) => c.name === COLLECTION_NAME,
    )

    if (exists) {
      logger.info("Qdrant collection already exists", {
        collection: COLLECTION_NAME,
      })
      return true
    }

    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: DISTANCE,
      },
    })

    logger.info("Created Qdrant collection", {
      collection: COLLECTION_NAME,
      vectorSize: VECTOR_SIZE,
      distance: DISTANCE,
    })

    return true
  } catch (error) {
    logger.error("Failed to ensure Qdrant collection", {
      collection: COLLECTION_NAME,
      error: String(error),
    })
    return false
  }
}

/**
 * Delete the entire knowledge collection (for testing/reset).
 */
export async function deleteCollection(): Promise<boolean> {
  const client = getQdrantClient()
  if (!client) return false

  try {
    await client.deleteCollection(COLLECTION_NAME)
    logger.info("Deleted Qdrant collection", { collection: COLLECTION_NAME })
    return true
  } catch (error) {
    logger.error("Failed to delete Qdrant collection", {
      error: String(error),
    })
    return false
  }
}

/**
 * Get collection statistics.
 */
export async function getCollectionStats(): Promise<CollectionStats | null> {
  const client = getQdrantClient()
  if (!client) return null

  try {
    const info = await client.getCollection(COLLECTION_NAME)
    return {
      name: COLLECTION_NAME,
      pointsCount: info.points_count ?? 0,
      vectorsCount: info.vectors_count ?? 0,
      status: info.status ?? "unknown",
    }
  } catch (error) {
    logger.error("Failed to get collection stats", {
      error: String(error),
    })
    return null
  }
}

/**
 * Check if Qdrant is configured and reachable.
 */
export function isQdrantConfigured(): boolean {
  return Boolean(QDRANT_URL && QDRANT_API_KEY)
}
