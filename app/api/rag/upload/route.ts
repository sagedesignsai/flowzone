/**
 * POST /api/rag/upload
 *
 * Upload and parse a document. Accepts a multipart file upload.
 * Returns the parsed content as text/markdown.
 *
 * Optionally indexes the content into the RAG knowledge base
 * for future retrieval via searchKnowledge.
 *
 * Request:  multipart/form-data with fields:
 *   - file:       File (required) — the document to parse
 *   - format:     "text" | "markdown" (optional, default "markdown")
 *   - ingest:     "true" | "false" (optional, default "false" — index into RAG?)
 *
 * Response: 200 { content, fileName, fileType, metadata, pageCount, ... }
 *           400 { error: string }
 *           401 { error: string }
 *           415 { error: string }
 *           500 { error: string }
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { parseDocument, detectFileType, SUPPORTED_FILE_TYPES } from "@/lib/rag/reader"

export const maxDuration = 60 // 60s for large file parsing

/**
 * GET /api/rag/upload
 *
 * Returns supported file types and configuration status.
 */
export async function GET() {
  return NextResponse.json({
    supportedFormats: SUPPORTED_FILE_TYPES,
    ragConfigured: Boolean(
      process.env.QDRANT_URL &&
        process.env.QDRANT_API_KEY &&
        process.env.COHERE_API_KEY,
    ),
  })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const fileField = formData.get("file")

    if (!fileField || !(fileField instanceof File)) {
      return NextResponse.json(
        { error: "A file is required. Use field name 'file'." },
        { status: 400 },
      )
    }

    const file = fileField as File
    const fileType = detectFileType(file.name)

    if (!fileType) {
      return NextResponse.json(
        {
          error: `Unsupported file type: "${file.name}". Supported: ${SUPPORTED_FILE_TYPES.join(", ")}`,
        },
        { status: 415 },
      )
    }

    const outputFormat = formData.get("format") === "text" ? "text" : "markdown"
    const ingest = formData.get("ingest") === "true"

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await parseDocument(buffer, file.name, {
      format: outputFormat,
    })

    // Optionally index into RAG
    let ingestionResult = null
    if (ingest) {
      const { parseAndIngest } = await import("@/lib/rag/reader")
      const idxResult = await parseAndIngest(buffer, file.name, {
        returnContent: false,
      })
      ingestionResult = {
        ingested: idxResult.ingested,
        chunksIndexed: idxResult.chunksIndexed,
        error: idxResult.error ?? null,
      }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      fileType: result.format,
      content: result.content,
      metadata: result.metadata,
      pageCount: result.pageCount,
      warnings: result.warnings,
      ingestion: ingestionResult,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse document"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
