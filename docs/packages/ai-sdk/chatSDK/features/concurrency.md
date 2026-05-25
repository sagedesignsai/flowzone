# Overlapping Messages

Control how overlapping messages on the same thread are handled — queue, debounce, drop, or process concurrently.

When multiple messages arrive on the same thread while a handler is still processing, the SDK needs a strategy. By default, the incoming message is dropped. The `concurrency` option on `ChatConfig` lets you choose what happens instead.

## Strategies

### Drop (default)

The original behavior. If a handler is already running on a thread, the new message is discarded and a `LockError` is thrown. No queuing, no retries.

```typescript
const bot = new Chat({
  concurrency: "drop",
  // ...
});
```

### Queue

Messages that arrive while a handler is running are enqueued. When the current handler finishes, only the **latest** queued message is dispatched. All intermediate messages are provided as `context.skipped`, giving your handler full visibility into what happened while it was busy.

```typescript
const bot = new Chat({
  concurrency: "queue",
  // ...
});

bot.onNewMention(async (thread, message, context) => {
  if (context && context.skipped.length > 0) {
    await thread.post(
      `You sent ${context.totalSinceLastHandler} messages while I was thinking. Responding to your latest.`
    );
  }
  const response = await generateAIResponse(message.text);
  await thread.post(response);
});
```

### Debounce

Every message starts or resets a debounce timer. Only the **final message in a burst** is processed.

This is particularly useful for platforms like **WhatsApp** and **Telegram** where users tend to send a flurry of short messages in quick succession instead of composing a single message.

```typescript
const bot = new Chat({
  concurrency: { strategy: "debounce", debounceMs: 1500 },
  // ...
});
```

### Concurrent

No locking at all. Every message is processed immediately in its own handler invocation. Use this for stateless handlers where thread ordering doesn't matter.

```typescript
const bot = new Chat({
  concurrency: "concurrent",
  // ...
});
```

## Configuration

For fine-grained control, pass a `ConcurrencyConfig` object instead of a strategy string:

```typescript
const bot = new Chat({
  concurrency: {
    strategy: "queue",
    maxQueueSize: 20,
    onQueueFull: "drop-oldest",
    queueEntryTtlMs: 60_000,
  },
  // ...
});
```

### All options

| Option | Strategies | Default | Description |
| --- | --- | --- | --- |
| `strategy` | all | `"drop"` | The concurrency strategy to use |
| `maxQueueSize` | queue, debounce | `10` | Maximum queued messages per thread |
| `onQueueFull` | queue, debounce | `"drop-oldest"` | Whether to evict oldest or reject newest |
| `queueEntryTtlMs` | queue, debounce | `90000` | TTL for queued entries in milliseconds |
| `debounceMs` | debounce | `1500` | Debounce window in milliseconds |
| `maxConcurrent` | concurrent | `Infinity` | Max concurrent handlers per thread |

## MessageContext

All handler types accept an optional `MessageContext` as their last parameter. It is only populated when using the `queue` strategy and messages were skipped.

```typescript
interface MessageContext {
  skipped: Message[];
  totalSinceLastHandler: number;
}
```

### Example: Pass all messages to an LLM

```typescript
bot.onSubscribedMessage(async (thread, message, context) => {
  const allMessages = [...(context?.skipped ?? []), message];
  const response = await generateAIResponse(
    allMessages.map((m) => m.text).join("\n\n")
  );
  await thread.post(response);
});
```

## Lock scope

By default, locks are scoped to the thread. For platforms like WhatsApp and Telegram where conversations happen at the channel level, the lock scope defaults to `"channel"`.

You can override this globally:

```typescript
const bot = new Chat({
  concurrency: "queue",
  lockScope: "channel",
  // ...
});
```

Or resolve it dynamically per message:

```typescript
const bot = new Chat({
  concurrency: "queue",
  lockScope: ({ isDM, adapter }) => {
    return isDM ? "channel" : "thread";
  },
  // ...
});
```

## Choosing a strategy

| Use case | Strategy | Why |
| --- | --- | --- |
| Simple bots, one-shot commands | `drop` | No complexity, no queue overhead |
| AI chatbots, customer support | `queue` | Never lose messages; handler sees full context |
| WhatsApp/Telegram bots | `debounce` | Users send many short messages in quick succession |
| Stateless lookups, translations | `concurrent` | Maximum throughput, no ordering needed |

---

**Source:** https://chat-sdk.dev/docs/concurrency
