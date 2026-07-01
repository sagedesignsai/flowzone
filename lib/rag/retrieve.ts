/**
 * RAG Retrieval Pipeline
 *
 * Embeds a user query, searches Qdrant for semantically similar content,
 * and optionally reranks results using Cohere's rerank model.
 *
 * Flow: user query → embed (search_query) → Qdrant search → rerank (optional) → results
 */

import { rerank } from "ai"
import { cohere } from "@ai-sdk/cohere"
import { getQdrantClient, getCollectionName } from "@/lib/rag/qdrant"
import { embedQuery } from "@/lib/rag/embeddings"
import { logger } from "@/lib/logger"

// ─── Types ──────────────────────────────────────────────────

export interface RetrievedChunk {
  /** The chunk text content */
  content: string
  /** Source identifier */
  source: string
  /** Metadata payload */
  metadata: Record<string, unknown>
  /** Similarity score (cosine distance → similarity) */
  score: number
  /** Rerank score if reranking was applied */
  rerankScore?: number
}

export interface RetrieveOptions {
  /** Maximum number of results to return (before reranking) */
  limit?: number
  /** Minimum similarity threshold (0-1) */
  minScore?: number
  /** Whether to apply Cohere reranking */
  rerank?: boolean
  /** Number of top results after reranking */
  rerankTopN?: number
}

// ─── Defaults ───────────────────────────────────────────────

const DEFAULT_LIMIT = 10
const DEFAULT_MIN_SCORE = 0.5
const DEFAULT_RERANK_TOP_N = 5

// ─── Retrieval ──────────────────────────────────────────────

/**
 * Search the knowledge base for content relevant to a query.
 *
 * 1. Embeds the query using Cohere (inputType: "search_query")
 * 2. Searches Qdrant for nearest neighbors
 * 3. Optionally reranks with Cohere's rerank-v3.5
 */
export async function searchKnowledge(
  query: string,
  options: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const client = getQdrantClient()
  if (!client) {
    logger.warn("Cannot search: Qdrant not configured")
    return []
  }

  const {
    limit = DEFAULT_LIMIT,
    minScore = DEFAULT_MIN_SCORE,
    rerank: shouldRerank = false,
    rerankTopN = DEFAULT_RERANK_TOP_N,
  } = options

  try {
    // 1. Embed the query
    const queryVector = await embedQuery(query)

    // 2. Search Qdrant
    const searchResult = await client.query(getCollectionName(), {
      query: queryVector,
      limit: shouldRerank ? limit * 2 : limit, // Fetch more if reranking
      with_payload: true,
    })

    const results: RetrievedChunk[] =
      searchResult.points?.map((point) => ({
        content: (point.payload?.content as string) ?? "",
        source: (point.payload?.source as string) ?? "unknown",
        metadata: (point.payload?.metadata as Record<string, unknown>) ?? {},
        score: point.score ?? 0,
      })) ?? []

    // Filter by minimum score
    const filtered = results.filter((r) => r.score >= minScore)

    if (filtered.length === 0) {
      return []
    }

    // 3. Optional reranking with Cohere
    if (shouldRerank) {
      return await rerankResults(query, filtered, rerankTopN)
    }

    return filtered
  } catch (error) {
    logger.error("Knowledge search failed", {
      query: query.slice(0, 100),
      error: String(error),
    })
    return []
  }
}

// ─── Reranking ──────────────────────────────────────────────

/**
 * Rerank retrieved chunks using Cohere's rerank-v3.5 model.
 * This cross-encoder model scores query-document pairs more accurately
 * than cosine similarity on bi-encoder embeddings.
 */
async function rerankResults(
  query: string,
  results: RetrievedChunk[],
  topN: number,
): Promise<RetrievedChunk[]> {
  try {
    const documents = results.map((r) => r.content)

    const { ranking } = await rerank({
      model: cohere.reranking("rerank-v3.5"),
      query,
      documents,
      topN,
    })

    // Merge rerank scores back into results
    const reranked = ranking.map((rank) => {
      const original = results[rank.originalIndex]
      return {
        ...original,
        rerankScore: rank.score,
        score: rank.score, // Replace similarity score with rerank score
      }
    })

    return reranked.sort((a, b) => b.score - a.score)
  } catch (error) {
    logger.warn("Reranking failed, falling back to vector search order", {
      error: String(error),
    })
    return results
  }
}

/**
 * Format retrieved chunks into a context string for LLM prompts.
 */
export function formatRetrievedContext(results: RetrievedChunk[]): string {
  if (results.length === 0) return ""

  return results
    .map(
      (r, i) =>
        `[${i + 1}] Source: ${r.source}\nContent: ${r.content}\n`,
    )
    .join("\n")
}
