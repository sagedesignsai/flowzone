import { customProvider, gateway } from "ai"

/**
 * Centralized AI Provider Configuration
 *
 * Provides access to configured language models.
 * Prioritises cost-effective models with strong tool-calling abilities.
 *
 * Usage:
 *   const model = getPrimaryModel()
 *   const fastModel = getFastModel()
 *
 * All models route through the Vercel AI Gateway when AI_GATEWAY_API_KEY is set.
 */

export const aiProvider = customProvider({
  languageModels: {
    // Primary model for complex agent tasks (coding, tool loops, reasoning).
    // Google Gemini 3 Flash: excellent tool calling, fast, cost-effective.
    "primary": gateway("google/gemini-3.1-pro-preview"),

    // Fast, cheap model for simple tasks (title gen, summarisation, classification).
    // Google Gemini 3.1 Flash Lite: extremely cheap, fine for simple structured output.
    "fast": gateway("google/gemini-3.1-flash-lite"),

    // Coding-specialist fallback — Qwen Coder has strong code + tool performance.
    "coder": gateway("alibaba/qwen3-coder"),
  },
  fallbackProvider: gateway,
})

/**
 * Get the primary model for complex tasks (coding, reasoning, agent loops).
 */
export function getPrimaryModel() {
  if (process.env.AI_GATEWAY_API_KEY) {
    return aiProvider.languageModel("primary")
  }
  // Direct-provider fallbacks when the gateway is unavailable
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    // Will use @ai-sdk/google if available as a fallback
  }
  return null
}

/**
 * Get a fast, cheap model for simple tasks (title generation, summarisation).
 */
export function getFastModel() {
  if (process.env.AI_GATEWAY_API_KEY) {
    return aiProvider.languageModel("fast")
  }
  return null
}

/**
 * Get a coding-specialist model for code-heavy agent steps.
 * Falls back to the primary model if unavailable.
 */
export function getCoderModel() {
  if (process.env.AI_GATEWAY_API_KEY) {
    return aiProvider.languageModel("coder")
  }
  return getPrimaryModel()
}
