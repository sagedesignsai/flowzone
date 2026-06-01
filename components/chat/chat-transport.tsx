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
 */
export function useChatTransport(
  projectId?: string,
  useWebSearch?: boolean,
) {
  const [browserSupportsLocal, setBrowserSupportsLocal] = useState(false)

  useEffect(() => {
    setBrowserSupportsLocal(doesBrowserSupportTransformersJS())
  }, [])

  // Use local inference only when the browser supports it AND web search is off
  // (web search requires server-side tooling)
  const useLocalInference = browserSupportsLocal && !useWebSearch

  const transport = useMemo(() => {
    if (useLocalInference) {
      return new TransformersChatTransport()
    }
    return new DefaultChatTransport({
      body: () => ({
        projectId,
        webSearch: useWebSearch ?? false,
      }),
    })
  }, [projectId, useWebSearch, useLocalInference])

  return { transport, useLocalInference, browserSupportsLocal }
}
