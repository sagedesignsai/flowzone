/**
 * Document Reader Service
 *
 * Parses documents in various formats (PDF, DOCX, XLSX, PPTX, MD, CSV, etc.)
 * into clean text or markdown for agent consumption or RAG ingestion.
 *
 * Powered by officeparser — a universal office document parser.
 *
 * @see https://www.npmjs.com/package/officeparser
 */

import { readFile as fsReadFile } from "node:fs/promises"
import { OfficeParser } from "officeparser"
import { logger } from "@/lib/logger"
import { indexText } from "./indexer"

// ─── Types ──────────────────────────────────────────────────

export type SupportedFileType =
  | "pdf"
  | "docx"
  | "xlsx"
  | "pptx"
  | "odt"
  | "odp"
  | "ods"
  | "rtf"
  | "csv"
  | "md"
  | "html"
  | "txt"

export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "odt",
  "odp",
  "ods",
  "rtf",
  "csv",
  "md",
  "html",
  "txt",
]

export type ReadOutputFormat = "text" | "markdown" | "json"

export interface ReadOptions {
  /** Output format: plain text, markdown, or raw JSON AST */
  format?: ReadOutputFormat
  /** Page/slide range: "1-5,7,10" */
  pages?: string
  /** Log non-fatal warnings */
  verbose?: boolean
}

export interface ReadResult {
  /** The parsed text/markdown content */
  content: string
  /** Format detected */
  format: string
  /** Document metadata (title, author, etc.) */
  metadata: Record<string, unknown>
  /** Number of pages if available */
  pageCount?: number
  /** Warnings from the parser */
  warnings: string[]
}

// ─── File Type Detection ────────────────────────────────────

const EXTENSION_MAP: Record<string, SupportedFileType> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".xlsx": "xlsx",
  ".pptx": "pptx",
  ".odt": "odt",
  ".odp": "odp",
  ".ods": "ods",
  ".rtf": "rtf",
  ".csv": "csv",
  ".md": "md",
  ".html": "html",
  ".htm": "html",
  ".txt": "txt",
}

/**
 * Detect file type from a file extension.
 * Returns the type or `null` if unsupported.
 */
export function detectFileType(filename: string): SupportedFileType | null {
  const ext = filename.toLowerCase().match(/\.[a-z]+$/)?.[0]
  if (!ext) return null
  return EXTENSION_MAP[ext] ?? null
}

/**
 * Check if a file type is supported by the reader.
 */
export function isFileTypeSupported(filename: string): boolean {
  return detectFileType(filename) !== null
}

// ─── Parsing ────────────────────────────────────────────────

const OUTPUT_FORMAT_MAP: Record<ReadOutputFormat, string> = {
  text: "text",
  markdown: "md",
  json: "json",
}

/**
 * Parse a document buffer into readable content.
 *
 * @param buffer - File contents as Buffer or Uint8Array
 * @param fileName - Original file name (for type detection)
 * @param options - Parsing options
 * @returns Parsed document content
 *
 * @example
 *   const buf = await readFile("report.pdf")
 *   const result = await parseDocument(buf, "report.pdf", { format: "markdown" })
 *   console.log(result.content)
 */
export async function parseDocument(
  buffer: Buffer | Uint8Array,
  fileName: string,
  options: ReadOptions = {},
): Promise<ReadResult> {
  const fileType = detectFileType(fileName)

  if (!fileType) {
    throw new Error(
      `Unsupported file type: "${fileName}". Supported: ${SUPPORTED_FILE_TYPES.join(", ")}`,
    )
  }

  const format = options.format ?? "markdown"
  const issues: string[] = []

    try {
      // Parse the document to get metadata
      const ast = await OfficeParser.parseOffice(buffer, {
        fileType: fileType as any,
        ignoreNotes: true,
        ignoreComments: true,
        ignoreHeadersAndFooters: true,
        newlineDelimiter: "\n",
        onWarning: options.verbose
          ? (issue: { message: string }) => issues.push(issue.message)
          : undefined,
      })

    const pageCount =
      fileType === "pdf"
        ? (ast.metadata.nativeProperties as Record<string, any>)?.Pages ??
          undefined
        : undefined

    // Convert to desired output format
    const outputTarget = OUTPUT_FORMAT_MAP[format]
    const { value } = await ast.to(outputTarget as any)

    return {
      content: typeof value === "string" ? value : String(value),
      format: fileType,
      metadata: {
        title: ast.metadata.title ?? null,
        author: ast.metadata.author ?? null,
        created: ast.metadata.created?.toISOString() ?? null,
        modified: ast.metadata.modified?.toISOString() ?? null,
        source: fileName,
      },
      pageCount,
      warnings: issues,
    }
  } catch (error) {
    logger.error("Document parse failed", {
      file: fileName,
      type: fileType,
      error: String(error),
    })
    throw new Error(
      `Failed to parse "${fileName}": ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Parse a document from a filesystem path.
 *
 * @param filePath - Absolute or relative path to the file
 * @param options - Parsing options
 * @returns Parsed document content
 */
export async function readDocumentFile(
  filePath: string,
  options: ReadOptions = {},
): Promise<ReadResult> {
  const fileName = filePath.split("/").pop() ?? filePath
  const buffer = await fsReadFile(filePath)
  return parseDocument(buffer, fileName, options)
}

// ─── Parse + Ingest to RAG ──────────────────────────────────

export interface IngestOptions extends ReadOptions {
  /** Override source label for RAG (defaults to filename) */
  source?: string
  /** Also return the parsed content (vs. silence on success) */
  returnContent?: boolean
}

/**
 * Parse a document and index its content into the RAG knowledge base.
 *
 * This is the primary entry point for "read and remember".
 *
 * @param buffer - File contents as Buffer or Uint8Array
 * @param fileName - Original file name
 * @param options - Parse and ingest options
 * @returns Result with ingestion status + optional parsed content
 */
export async function parseAndIngest(
  buffer: Buffer | Uint8Array,
  fileName: string,
  options: IngestOptions = {},
): Promise<{
  ingested: boolean
  chunksIndexed: number
  content?: string
  error?: string
}> {
  try {
    const result = await parseDocument(buffer, fileName, {
      ...options,
      format: "text",
    })

    const source = options.source ?? fileName

    const indexResult = await indexText(result.content, source)

    if (!indexResult.success) {
      return {
        ingested: false,
        chunksIndexed: 0,
        error: indexResult.error,
      }
    }

    return {
      ingested: true,
      chunksIndexed: indexResult.chunksIndexed,
      ...(options.returnContent ? { content: result.content } : {}),
    }
  } catch (error) {
    return {
      ingested: false,
      chunksIndexed: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Parse a document from a filesystem path and index into RAG.
 */
export async function readAndIngest(
  filePath: string,
  options: IngestOptions = {},
): Promise<{
  ingested: boolean
  chunksIndexed: number
  content?: string
  error?: string
}> {
  const fileName = filePath.split("/").pop() ?? filePath
  const buffer = await fsReadFile(filePath)
  return parseAndIngest(buffer, fileName, options)
}
