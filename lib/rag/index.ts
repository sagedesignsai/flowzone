/**
 * RAG Infrastructure - Vector Knowledge Base
 *
 * Complete RAG pipeline using Qdrant (vector store) + Cohere (embeddings)
 * integrated with the Vercel AI SDK.
 *
 * @see lib/rag/qdrant.ts       — Qdrant client + collection management
 * @see lib/rag/embeddings.ts   — Cohere embedding via AI SDK
 * @see lib/rag/chunk.ts        — Text chunking strategies
 * @see lib/rag/retrieve.ts     — Retrieval pipeline
 * @see lib/rag/tools.ts        — AI SDK tools for agents
 */

export { getQdrantClient, ensureCollection, isQdrantConfigured } from "./qdrant"
export type { CollectionStats } from "./qdrant"

export { indexText, indexSources } from "./index"
export type { IndexableSource, IndexResult, IndexOptions } from "./index"

export { searchKnowledge, formatRetrievedContext } from "./retrieve"
export type { RetrievedChunk, RetrieveOptions } from "./retrieve"

export { createKnowledgeTools } from "./tools"

export { chunkText } from "./chunk"
export type { Chunk, ChunkingStrategy, ChunkingOptions } from "./chunk"
