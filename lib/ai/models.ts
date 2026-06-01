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
    primary: gateway("alibaba/qwen3-coder-next"),

    // Fast, cheap model for simple tasks (title gen, summarisation, classification).
    // Google Gemini 3.1 Flash Lite: extremely cheap, fine for simple structured output.
    fast: gateway("google/gemini-3.1-flash-lite"),

    // Coding-specialist fallback — Qwen Coder has strong code + tool performance.
    coder: gateway("alibaba/qwen3-coder-next"),
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

// ─── Local Transformers.js Models ────────────────────────────────────────

export interface LocalModelConfig {
  /** HuggingFace model ID */
  id: string
  /** Human-readable display name */
  name: string
  /** Short description of the model's strengths */
  description: string
  /** Inference device (default: webgpu) */
  device?: string
  /** Quantization dtype */
  dtype?: string
  /** Whether this model supports Web Worker offloading */
  supportsWorker?: boolean
  /** Approximate download size for display */
  size: string
}

export const LOCAL_MODELS: LocalModelConfig[] = [
  {
    id: "onnx-community/Qwen2.5-Coder-0.5B-Instruct",
    name: "Qwen2.5 Coder 0.5B",
    description: "Fast code-focused model, ideal for quick edits and code review",
    device: "webgpu",
    dtype: "q4f16",
    supportsWorker: true,
    size: "~400 MB",
  },
  {
    id: "onnx-community/Qwen3-0.6B-ONNX",
    name: "Qwen3 0.6B",
    description: "Better reasoning and tool-calling capabilities",
    device: "webgpu",
    dtype: "q4f16",
    supportsWorker: true,
    size: "~500 MB",
  },
  {
    id: "onnx-community/granite-4.0-350m-ONNX-web",
    name: "Granite 4.0 350M",
    description: "Lightweight model for resource-constrained devices",
    device: "webgpu",
    dtype: "fp16",
    supportsWorker: true,
    size: "~250 MB",
  },
]

export const DEFAULT_LOCAL_MODEL_ID = LOCAL_MODELS[0].id

/**
 * Get the default local model ID.
 */
export function getLocalModelId(): string {
  return DEFAULT_LOCAL_MODEL_ID
}
