"use client"

import { useEffect, useMemo, useState } from "react"
import { DefaultChatTransport } from "ai"
import { doesBrowserSupportTransformersJS } from "@browser-ai/transformers-js"
import { TransformersChatTransport } from "@/lib/ai/transformers-transport"

/**
 * Hook that selects the appropriate transport for AI inference.
 *
 * - If the browser supports Transformers.js (WebGPU) and web search is OFF,
 *   uses a local model via TransformersChatTransport (client-side, no API cost).
 * - Falls back to DefaultChatTransport when web search is ON or WebGPU is
 *   unavailable (routes to the server API where tools live).
 *
 * @param projectId - Optional project ID to scope the chat
 * @param useWebSearch - Whether web search is enabled
 * @param environment - Optional environment label
 * @param apiPath - API endpoint for chat (default: /api/workspace/desktop)
 */
export function useChatTransport(
  projectId?: string,
  useWebSearch?: boolean,
  environment?: string,
  apiPath?: string,
) {
  const [browserSupportsLocal, setBrowserSupportsLocal] = useState(false)

  useEffect(() => {
    setBrowserSupportsLocal(doesBrowserSupportTransformersJS())
  }, [])

  // Use local inference only when the browser supports it AND web search is off
  // (web search requires server-side tooling)
  const useLocalInference = browserSupportsLocal && !useWebSearch

  const path = apiPath ?? "/api/workspace/desktop"

  const transport = useMemo(() => {
    if (useLocalInference) {
      return new TransformersChatTransport()
    }
    return new DefaultChatTransport({
      api: path,
      body: () => ({
        projectId,
        webSearch: useWebSearch ?? false,
        environment,
      }),
    })
  }, [projectId, useWebSearch, useLocalInference, environment, path])

  return { transport, useLocalInference, browserSupportsLocal }
}
