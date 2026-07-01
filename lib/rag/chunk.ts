/**
 * Text Chunking Strategies for RAG
 *
 * Provides multiple chunking strategies to break source documents
 * into smaller pieces suitable for embedding and retrieval.
 */

// ─── Types ──────────────────────────────────────────────────

export interface Chunk {
  /** The chunk text content */
  content: string
  /** Character offset from the source document start */
  startIndex: number
  /** Character offset to the end of this chunk */
  endIndex: number
}

export interface ChunkingOptions {
  /** Maximum characters per chunk */
  maxSize?: number
  /** Character overlap between consecutive chunks */
  overlap?: number
}

// ─── Strategies ─────────────────────────────────────────────

const DEFAULT_MAX_SIZE = 1000
const DEFAULT_OVERLAP = 100

/**
 * Sentence-based chunking: splits on sentence boundaries (. ! ?).
 * Preserves whole sentences within each chunk.
 */
export function chunkBySentences(
  text: string,
  options: ChunkingOptions = {},
): Chunk[] {
  const { maxSize = DEFAULT_MAX_SIZE, overlap = DEFAULT_OVERLAP } = options
  const sentences = text.match(/[^.!?\n]+[.!?]*/g) || [text]
  const chunks: Chunk[] = []
  let current = ""
  let currentStart = 0

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    if (current.length + trimmed.length > maxSize && current.length > 0) {
      chunks.push({
        content: current.trim(),
        startIndex: currentStart,
        endIndex: currentStart + current.length,
      })
      // Keep overlap from the end of current
      const overlapText = current.slice(-overlap)
      current = overlapText + " " + trimmed
      currentStart = currentStart + current.length - overlapText.length - 1
    } else {
      if (current.length === 0) {
        currentStart = text.indexOf(trimmed)
      }
      current += (current ? " " : "") + trimmed
    }
  }

  if (current.trim()) {
    chunks.push({
      content: current.trim(),
      startIndex: currentStart,
      endIndex: currentStart + current.length,
    })
  }

  return chunks
}

/**
 * Paragraph-based chunking: splits on double newlines.
 * Good for markdown, structured documents.
 */
export function chunkByParagraphs(
  text: string,
  options: ChunkingOptions = {},
): Chunk[] {
  const { maxSize = DEFAULT_MAX_SIZE } = options
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim())
  const chunks: Chunk[] = []
  let current = ""
  let currentStart = 0

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    if (current.length + trimmed.length > maxSize && current.length > 0) {
      chunks.push({
        content: current.trim(),
        startIndex: currentStart,
        endIndex: currentStart + current.length,
      })
      current = trimmed
      currentStart = text.indexOf(trimmed, currentStart + current.length)
    } else {
      if (current.length === 0) {
        currentStart = text.indexOf(trimmed)
      }
      current += (current ? "\n\n" : "") + trimmed
    }
  }

  if (current.trim()) {
    chunks.push({
      content: current.trim(),
      startIndex: currentStart,
      endIndex: currentStart + current.length,
    })
  }

  return chunks
}

/**
 * Recursive character splitting: splits on descending delimiters.
 * Inspired by LangChain's RecursiveCharacterTextSplitter.
 * Delimiters: \n\n → \n → . → character
 */
export function chunkRecursively(
  text: string,
  options: ChunkingOptions = {},
): Chunk[] {
  const { maxSize = DEFAULT_MAX_SIZE, overlap = DEFAULT_OVERLAP } = options

  function split(text: string, delimiters: string[]): string[] {
    if (text.length <= maxSize || delimiters.length === 0) {
      return [text]
    }

    const delimiter = delimiters[0]
    const parts = text.split(delimiter)
    const result: string[] = []

    for (const part of parts) {
      if (part.length > maxSize) {
        // Try next delimiter
        result.push(...split(part, delimiters.slice(1)))
      } else {
        result.push(part)
      }
    }

    return result
  }

  const segments = split(text, ["\n\n", "\n", ". ", " "])
  const chunks: Chunk[] = []
  let current = ""
  let currentStart = 0

  for (const segment of segments) {
    const trimmed = segment.trim()
    if (!trimmed) continue

    if (current.length + trimmed.length > maxSize && current.length > 0) {
      chunks.push({
        content: current.trim(),
        startIndex: currentStart,
        endIndex: currentStart + current.length,
      })
      const overlapText = current.slice(-overlap)
      current = overlapText + " " + trimmed
      currentStart = text.indexOf(trimmed, Math.max(0, currentStart))
    } else {
      if (current.length === 0) {
        currentStart = text.indexOf(trimmed)
      }
      current += (current ? " " : "") + trimmed
    }
  }

  if (current.trim()) {
    chunks.push({
      content: current.trim(),
      startIndex: currentStart,
      endIndex: currentStart + current.length,
    })
  }

  return chunks
}

// ─── Default Strategy ──────────────────────────────────────

export type ChunkingStrategy = "sentences" | "paragraphs" | "recursive"

const STRATEGIES: Record<ChunkingStrategy, typeof chunkBySentences> = {
  sentences: chunkBySentences,
  paragraphs: chunkByParagraphs,
  recursive: chunkRecursively,
}

/**
 * Chunk text using the specified strategy.
 * Defaults to recursive splitting.
 */
export function chunkText(
  text: string,
  strategy: ChunkingStrategy = "recursive",
  options?: ChunkingOptions,
): Chunk[] {
  return STRATEGIES[strategy](text, options)
}
