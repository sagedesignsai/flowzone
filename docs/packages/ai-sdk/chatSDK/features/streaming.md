# Streaming

Stream real-time text responses from AI models and other async sources to chat platforms.

Chat SDK accepts any `AsyncIterable` as a message, enabling real-time streaming of AI responses and other incremental content to chat platforms. For platforms with native streaming support (Slack), you can also stream structured `StreamChunk` objects for rich content like task progress cards and plan updates.

## AI SDK integration

Pass an AI SDK `fullStream` or `textStream` directly to `thread.post()`:

```typescript
import { ToolLoopAgent } from "ai";

const agent = new ToolLoopAgent({
  model: "anthropic/claude-4.5-sonnet",
  instructions: "You are a helpful assistant.",
});

bot.onNewMention(async (thread, message) => {
  const result = await agent.stream({ prompt: message.text });
  await thread.post(result.fullStream);
});
```

### Why `fullStream` over `textStream`?

When AI SDK agents make tool calls between text steps, `textStream` concatenates all text without separators. The `fullStream` contains explicit `finish-step` events that Chat SDK uses to inject paragraph breaks between steps automatically.

Both stream types are auto-detected:

```typescript
// Recommended: fullStream preserves step boundaries
await thread.post(result.fullStream);

// Also works: textStream for single-step generation
await thread.post(result.textStream);
```

## Custom streams

Any async iterable works:

```typescript
const stream = (async function* () {
  yield "Processing";
  yield "...";
  yield " done!";
})();

await thread.post(stream);
```

## Platform behavior

| Platform | Method | Description |
| --- | --- | --- |
| Slack | Native streaming API | Uses Slack's `chatStream` for smooth, real-time updates |
| Teams | Post + Edit | Posts a message then edits it as chunks arrive |
| Google Chat | Post + Edit | Posts a message then edits it as chunks arrive |
| Discord | Post + Edit | Posts a message then edits it as chunks arrive |

The post+edit fallback throttles edits to avoid rate limits. Configure the update interval when creating your `Chat` instance:

```typescript
const bot = new Chat({
  // ...
  streamingUpdateIntervalMs: 500, // Default: 500ms
});
```

### Disabling the placeholder message

By default, post+edit adapters send an initial `"..."` placeholder message before the first chunk arrives. You can disable this to wait for real content before posting:

```typescript
const bot = new Chat({
  // ...
  fallbackStreamingPlaceholderText: null,
});
```

You can also customize the placeholder text:

```typescript
const bot = new Chat({
  // ...
  fallbackStreamingPlaceholderText: "Thinking...",
});
```

## Markdown healing

During streaming, chunks often arrive mid-word or mid-syntax. The SDK automatically heals incomplete markdown in intermediate renders, so messages always display with correct formatting while streaming.

The final message uses the raw accumulated text without healing, so the original markdown is preserved.

## Table buffering

When streaming content that contains GFM tables (e.g. from an LLM), the SDK automatically buffers potential table headers until a separator line confirms them. This prevents tables from briefly flashing as raw pipe-delimited text before the table structure is complete.

This happens transparently — no configuration needed.

## Structured streaming chunks (Slack only)

For Slack's native streaming API, you can yield `StreamChunk` objects alongside plain text for rich content:

```typescript
import type { StreamChunk } from "chat";

const stream = (async function* () {
  yield { type: "markdown_text", text: "Searching..." } satisfies StreamChunk;

  yield {
    type: "task_update",
    id: "search-1",
    title: "Searching documents",
    status: "in_progress",
  } satisfies StreamChunk;

  // ... do work ...

  yield {
    type: "task_update",
    id: "search-1",
    title: "Searching documents",
    status: "complete",
    output: "Found 3 results",
  } satisfies StreamChunk;

  yield { type: "markdown_text", text: "Here are your results..." } satisfies StreamChunk;
})();

await thread.post(stream);
```

### Chunk types

| Type | Fields | Description |
| --- | --- | --- |
| `markdown_text` | `text` | Streamed text content |
| `task_update` | `id`, `title`, `status`, `output?` | Tool/step progress cards |
| `plan_update` | `title` | Plan title updates |

## Streaming with conversation history

Combine message history with streaming for multi-turn AI conversations. Use `toAiMessages()` to convert chat messages into the `{ role, content }` format expected by AI SDKs:

```typescript
import { toAiMessages } from "chat";

bot.onSubscribedMessage(async (thread, message) => {
  // Fetch recent messages for context
  const result = await thread.adapter.fetchMessages(thread.id, { limit: 20 });

  const history = await toAiMessages(result.messages);
  const response = await agent.stream({ prompt: history });
  await thread.post(response.fullStream);
});
```

---

**Source:** https://chat-sdk.dev/docs/streaming
