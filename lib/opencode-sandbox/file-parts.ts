import type { FilePart } from "@opencode-ai/sdk/v2"
import type { ProviderMetadata, UIMessageChunk } from "ai"

function providerMetadata(part: FilePart): ProviderMetadata | undefined {
  return part.source
    ? {
        opencode: {
          source: part.source,
        },
      }
    : undefined
}

export function convertOpenCodeFilePartToUIChunks(
  part: FilePart,
): UIMessageChunk[] {
  if (!part.url || !part.mime) return []

  const sourceId = part.id ?? part.url
  const title = part.filename ?? part.url.split("/").pop() ?? "file"
  const metadata = providerMetadata(part)

  if (part.url.startsWith("http://") || part.url.startsWith("https://")) {
    return [
      {
        type: "source-url",
        sourceId,
        url: part.url,
        ...(part.filename ? { title: part.filename } : {}),
        ...(metadata ? { providerMetadata: metadata } : {}),
      },
    ]
  }

  if (part.url.startsWith("data:")) {
    return [
      {
        type: "file",
        url: part.url,
        mediaType: part.mime,
        ...(metadata ? { providerMetadata: metadata } : {}),
      },
    ]
  }

  return [
    {
      type: "source-document",
      sourceId,
      mediaType: part.mime,
      title,
      ...(part.filename ? { filename: part.filename } : {}),
      ...(metadata ? { providerMetadata: metadata } : {}),
    },
  ]
}
