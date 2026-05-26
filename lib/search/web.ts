import { logger } from "@/lib/logger"

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

export interface WebSearchResponse {
  query: string
  results: WebSearchResult[]
}

async function searchWithTavily(query: string): Promise<WebSearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not configured")
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tavily search failed: ${text}`)
  }

  const data = (await res.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>
  }

  return {
    query,
    results: (data.results ?? []).map((r) => ({
      title: r.title ?? "Untitled",
      url: r.url ?? "",
      snippet: r.content ?? "",
    })),
  }
}

async function searchWithSerper(query: string): Promise<WebSearchResponse> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not configured")
  }

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ q: query, num: 5 }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Serper search failed: ${text}`)
  }

  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>
  }

  return {
    query,
    results: (data.organic ?? []).map((r) => ({
      title: r.title ?? "Untitled",
      url: r.link ?? "",
      snippet: r.snippet ?? "",
    })),
  }
}

/**
 * Run a web search using Tavily (preferred) or Serper as fallback.
 */
export async function searchWeb(query: string): Promise<WebSearchResponse> {
  if (process.env.TAVILY_API_KEY) {
    try {
      return await searchWithTavily(query)
    } catch (error) {
      logger.warn("Tavily search failed, trying Serper", {
        error: String(error),
      })
    }
  }

  if (process.env.SERPER_API_KEY) {
    return searchWithSerper(query)
  }

  throw new Error(
    "Web search is not configured. Set TAVILY_API_KEY or SERPER_API_KEY.",
  )
}

export function isWebSearchConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY)
}
