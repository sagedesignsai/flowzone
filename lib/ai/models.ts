import { gateway } from "ai"
import { createCerebras } from "@ai-sdk/cerebras"
import { createGroq } from "@ai-sdk/groq"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createOpenAI } from "@ai-sdk/openai"
import { createVercel } from "@ai-sdk/vercel"
import type { LanguageModel } from "ai"

/**
 * Centralized AI Provider Configuration
 *
 * Provides access to configured language models with provider switching.
 * Set AI_PROVIDER to one of: gateway, groq, cerebras, anthropic, openai, vercel
 * Defaults to "cerebras" (gpt-oss-120b).
 *
 * Usage:
 *   const model = getPrimaryModel()
 *   const fastModel = getFastModel()
 *   const coderModel = getCoderModel()
 *
 * Each provider requires its corresponding API key env var:
 *   AI_GATEWAY_API_KEY, GROQ_API_KEY, CEREBRAS_API_KEY, etc.
 */

// ─── Types ────────────────────────────────────────────────

export type AIProviderName =
  | "gateway"
  | "groq"
  | "cerebras"
  | "anthropic"
  | "openai"
  | "vercel"

/** Model IDs mapped to each role for a given provider. */
export interface ProviderModels {
  primary: string
  fast: string
  coder: string
}

/** A registered provider definition. */
interface ProviderDefinition {
  label: string
  envKey: string
  models: ProviderModels
}

// ─── Provider Registry ──────────────────────────────────

const PROVIDER_DEFINITIONS: Record<AIProviderName, ProviderDefinition> = {
  gateway: {
    label: "Vercel AI Gateway",
    envKey: "AI_GATEWAY_API_KEY",
    models: {
      primary: "alibaba/qwen3-coder-next",
      fast: "google/gemini-3.1-flash-lite",
      coder: "alibaba/qwen3-coder-next",
    },
  },
  groq: {
    label: "Groq (LPU Inference)",
    envKey: "GROQ_API_KEY",
    models: {
      primary: "llama-3.3-70b-versatile",
      fast: "gemma2-9b-it",
      coder: "qwen/qwen3-32b",
    },
  },
  cerebras: {
    label: "Cerebras (Wafer-Scale)",
    envKey: "CEREBRAS_API_KEY",
    models: {
      primary: "gpt-oss-120b",
      fast: "llama3.1-8b",
      coder: "gpt-oss-120b",
    },
  },
  anthropic: {
    label: "Anthropic Claude",
    envKey: "ANTHROPIC_API_KEY",
    models: {
      primary: "claude-sonnet-4-20250514",
      fast: "claude-haiku-4-5",
      coder: "claude-sonnet-4-20250514",
    },
  },
  openai: {
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    models: {
      primary: "gpt-4o",
      fast: "gpt-4o-mini",
      coder: "gpt-4o",
    },
  },
  vercel: {
    label: "Vercel v0 (UI Generation)",
    envKey: "VERCEL_API_KEY",
    models: {
      primary: "v0-1.5-md",
      fast: "v0-1.5-md",
      coder: "v0-1.5-md",
    },
  },
}

// ─── Active Provider Selection ──────────────────────────

/**
 * Returns the active provider name based on AI_PROVIDER env var.
 * Defaults to "cerebras" when the requested provider's API key is missing
 * or AI_PROVIDER is not set.
 */
export function getActiveProvider(): AIProviderName {
  const requested = process.env.AI_PROVIDER as AIProviderName | undefined
  if (requested && PROVIDER_DEFINITIONS[requested]) {
    const def = PROVIDER_DEFINITIONS[requested]
    if (process.env[def.envKey]) {
      return requested
    }
  }
  return "vercel"
}

// ─── Lazy Provider Instances ────────────────────────────

let _groq: ReturnType<typeof createGroq> | null = null
let _cerebras: ReturnType<typeof createCerebras> | null = null
let _anthropic: ReturnType<typeof createAnthropic> | null = null
let _openai: ReturnType<typeof createOpenAI> | null = null
let _vercel: ReturnType<typeof createVercel> | null = null

/** Resolve a language model for the given role from the active provider. */
function resolveModel(role: "primary" | "fast" | "coder"): LanguageModel | null {
  const provider = getActiveProvider()
  const def = PROVIDER_DEFINITIONS[provider]

  if (!process.env[def.envKey]) return null

  const modelId = def.models[role]

  switch (provider) {
    case "gateway":
      return gateway(modelId)
    case "groq":
      if (!_groq) _groq = createGroq()
      return _groq(modelId)
    case "cerebras":
      if (!_cerebras) _cerebras = createCerebras()
      return _cerebras(modelId)
    case "anthropic":
      if (!_anthropic) _anthropic = createAnthropic()
      return _anthropic(modelId)
    case "openai":
      if (!_openai) _openai = createOpenAI()
      return _openai(modelId)
    case "vercel":
      if (!_vercel) _vercel = createVercel()
      return _vercel(modelId)
  }
}

// ─── Public Model API ───────────────────────────────────

/**
 * Get the primary model for complex tasks (coding, reasoning, agent loops).
 * Falls back based on the active provider's model mapping.
 */
export function getPrimaryModel(): LanguageModel | null {
  return resolveModel("primary")
}

/**
 * Get a fast, cheap model for simple tasks (title generation, summarisation).
 */
export function getFastModel(): LanguageModel | null {
  return resolveModel("fast")
}

/**
 * Get a coding-specialist model for code-heavy agent steps.
 * Falls back to the primary model if the coder model is unavailable.
 */
export function getCoderModel(): LanguageModel | null {
  return resolveModel("coder") ?? getPrimaryModel()
}

// ─── Provider Metadata (for UI / debugging) ─────────────

export interface ProviderInfo {
  name: AIProviderName
  label: string
  models: ProviderModels
  hasKey: boolean
  active: boolean
}

/** Get metadata about the currently active provider. */
export function getActiveProviderInfo(): ProviderInfo {
  const active = getActiveProvider()
  const def = PROVIDER_DEFINITIONS[active]
  return {
    name: active,
    label: def.label,
    models: def.models,
    hasKey: !!process.env[def.envKey],
    active: true,
  }
}

/** Get metadata about all registered providers (for settings UI). */
export function getAvailableProviders(): ProviderInfo[] {
  const active = getActiveProvider()
  return (Object.keys(PROVIDER_DEFINITIONS) as AIProviderName[]).map(
    (name) => {
      const def = PROVIDER_DEFINITIONS[name]
      return {
        name,
        label: def.label,
        models: def.models,
        hasKey: !!process.env[def.envKey],
        active: name === active,
      }
    },
  )
}

// ─── Local Transformers.js Models ────────────────────────

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
