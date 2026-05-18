---
source: Official docs
library: Vercel AI SDK
package: ai
topic: provider-management
fetched: 2026-05-18T10:00:00Z
official_docs: https://ai-sdk.dev/docs/ai-sdk-core/provider-management
---

# Provider & Model Management

The AI SDK offers **custom providers** and a **provider registry** for managing multiple providers and accessing models through string IDs.

## Custom Providers
You can create a custom provider using `customProvider` to override default settings, provide aliases, or limit available models.

```typescript
import { customProvider, gateway, defaultSettingsMiddleware, wrapLanguageModel } from 'ai';

export const myProvider = customProvider({
  languageModels: {
    // Alias model with custom settings
    'reasoning-fast': wrapLanguageModel({
      model: gateway('openai/gpt-5.1'),
      middleware: defaultSettingsMiddleware({
        settings: {
          providerOptions: { openai: { reasoningEffort: 'low' } },
        },
      }),
    }),
    // Simple alias
    'text-medium': gateway('anthropic/claude-3-5-sonnet-20240620'),
  },
  fallbackProvider: gateway,
});
```

## Provider Registry
Create a registry with multiple providers using `createProviderRegistry`.

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { createProviderRegistry, gateway } from 'ai';

export const registry = createProviderRegistry({
  gateway,    // default gateway prefix
  anthropic,  // direct provider import
  openai,
});

// Usage
import { generateText } from 'ai';
const { text } = await generateText({
  model: registry.languageModel('openai:gpt-5.1'), // providerId:modelId
  prompt: '...',
});
```

You can customize the separator with `{ separator: ' > ' }`.

## Global Provider and AI Gateway Usage
By default, the global provider is set to the **Vercel AI Gateway**.
You can use `gateway` directly as a provider or pass it to `createProviderRegistry`.

```typescript
import { streamText, gateway } from 'ai';

// Uses the global provider (defaults to Vercel AI Gateway)
const result = await streamText({
  model: "anthropic/claude-sonnet-4.5", 
  prompt: '...',
});
```

You can customize the global provider globally:
```typescript
import { openai } from '@ai-sdk/openai';

// Initialize once during startup:
globalThis.AI_SDK_DEFAULT_PROVIDER = openai;
```
