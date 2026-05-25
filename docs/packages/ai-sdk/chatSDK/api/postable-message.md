# PostableMessage

The union type accepted by thread.post() for sending messages.

`PostableMessage` is the union of all message formats accepted by `thread.post()` and `sent.edit()`.

## String

Raw text passed through as-is to the platform.

```typescript
await thread.post("Hello world");
```

## PostableRaw

Explicit raw text — behaves the same as a plain string.

```typescript
await thread.post({ raw: "Hello world" });
```

## PostableMarkdown

Markdown converted to each platform's native format.

```typescript
await thread.post({ markdown: "**Bold** and _italic_" });
```

## PostableAst

mdast AST converted to each platform's native format.

```typescript
import { root, paragraph, text, strong } from "chat";

await thread.post({
  ast: root([paragraph([strong([text("Hello")])])]),
});
```

## PostableCard

Rich card with interactive elements.

```typescript
import { Card, Text } from "chat";

await thread.post(Card({ title: "Hello", children: [Text("World")] }));
```

You can also pass a card with explicit fallback text:

```typescript
await thread.post({
  card: Card({ title: "Hello", children: [Text("World")] }),
  fallbackText: "Hello — World",
});
```

## AsyncIterable (streaming)

An async iterable of strings, `StreamChunk` objects, or stream events. The SDK streams the message in real time using platform-native APIs where available.

Both AI SDK stream types are supported:

```typescript
// fullStream (recommended) — preserves step boundaries
const result = await agent.stream({ prompt: message.text });
await thread.post(result.fullStream);

// textStream — plain string chunks
await thread.post(result.textStream);
```

## FileUpload

Used in the `files` field of any structured message format.

- `data` - File buffer or Uint8Array
- `filename` - Filename
- `mimeType` - MIME type (optional)

---

**Source:** https://chat-sdk.dev/docs/api/postable-message
