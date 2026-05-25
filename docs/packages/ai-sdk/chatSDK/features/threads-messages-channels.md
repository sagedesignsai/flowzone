# Threads, Messages, and Channels

Work with threads, messages, and channels across platforms.

## Threads

A `Thread` represents a conversation thread on any platform. It provides methods for posting messages, managing subscriptions, and accessing message history.

### Post a message

```typescript
// Plain text
await thread.post("Hello world");

// Markdown (converted to each platform's format)
await thread.post("**Bold** and _italic_ text");

// Structured message with attachments
await thread.post({
  markdown: "Here's a file:",
  files: [{ data: buffer, filename: "report.pdf" }],
});
```

### Subscribe and unsubscribe

Subscriptions persist across restarts (stored in your state adapter). When a thread is subscribed, all messages route to `onSubscribedMessage`.

```typescript
await thread.subscribe();
await thread.unsubscribe();
const subscribed = await thread.isSubscribed();
```

### Typing indicator

```typescript
await thread.startTyping();
```

Not all platforms support typing indicators. The call is a no-op on unsupported platforms.

### Message history

Access recent messages or iterate through full history:

```typescript
// Cached messages from the webhook payload
const recent = thread.recentMessages;

// Newest first (auto-paginates)
for await (const msg of thread.messages) {
  console.log(msg.text);
}

// Oldest first (auto-paginates)
for await (const msg of thread.allMessages) {
  console.log(msg.text);
}
```

### Thread state

Store typed, per-thread state that persists across requests. Pass a generic type parameter to `Chat` to get typed thread state across all handlers:

```typescript
interface ThreadState {
  aiMode?: boolean;
  context?: string;
}

const bot = new Chat<typeof adapters, ThreadState>({
  // ...config
});

bot.onNewMention(async (thread) => {
  await thread.setState({ aiMode: true });

  const state = await thread.state; // ThreadState | null
  if (state?.aiMode) {
    // AI mode is enabled
  }
});
```

State is stored in your state adapter with a 30-day TTL. Use `{ replace: true }` to replace state entirely instead of merging:

```typescript
await thread.setState({ aiMode: false }, { replace: true });
```

### Scheduled messages

Schedule a message for future delivery. The returned `ScheduledMessage` includes a `cancel()` method to abort before it's sent.

```typescript
const scheduled = await thread.schedule("Reminder: standup in 5 minutes!", {
  postAt: new Date("2026-03-09T09:00:00Z"),
});

// Cancel before it's sent
await scheduled.cancel();
```

Scheduled messages are currently only supported by the Slack adapter. Other adapters throw `NotImplementedError`.

## Messages

Incoming messages are normalized across platforms into a consistent format:

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` | Platform message ID |
| `threadId` | `string` | Thread ID in `adapter:channel:thread` format |
| `text` | `string` | Plain text content |
| `formatted` | `Root` | mdast AST representation |
| `raw` | `unknown` | Original platform-specific payload |
| `author` | `Author` | Message author info |
| `metadata` | `MessageMetadata` | Timestamps and edit status |
| `attachments` | `Attachment[]` (optional) | File attachments |
| `isMention` | `boolean` (optional) | Whether the bot was @-mentioned |

### Author

```typescript
interface Author {
  userId: string;
  userName: string;
  fullName: string;
  isBot: boolean | "unknown";
  isMe: boolean; // true if message is from the bot itself
}
```

### Sent messages

When you post a message, you get back a `SentMessage` with methods to edit, delete, and react:

```typescript
const sent = await thread.post("Processing...");

// Do some work...
await sent.edit("Done!");

// Or delete
await sent.delete();

// Add/remove reactions
await sent.addReaction(emoji.check);
await sent.removeReaction(emoji.check);
```

## Channels

A `Channel` represents the container that holds threads (e.g., a Slack channel, a Teams conversation). Navigate to a channel from a thread or get one directly:

```typescript
// From a thread
const channel = thread.channel;

// Directly by ID
const channel = bot.channel("slack:C123ABC");
```

### List threads

Iterate threads in a channel, most recently active first:

```typescript
for await (const thread of channel.threads()) {
  console.log(thread.rootMessage.text, thread.replyCount);
}
```

### Channel messages

Iterate top-level messages (not thread replies):

```typescript
for await (const msg of channel.messages) {
  console.log(msg.text);
}
```

### Post to a channel

Post a top-level message (not inside a thread):

```typescript
await channel.post("Hello channel!");
```

### Channel metadata

```typescript
const info = await channel.fetchMetadata();
console.log(info.name, info.memberCount);
```

## Thread ID format

All thread IDs follow the pattern `{adapter}:{channel}:{thread}`:

* **Slack**: `slack:C123ABC:1234567890.123456`
* **Teams**: `teams:{base64(conversationId)}:{base64(serviceUrl)}`
* **Google Chat**: `gchat:spaces/ABC123:{base64(threadName)}`
* **Discord**: `discord:{guildId}:{channelId}/{messageId}`

You typically don't need to construct these yourself — they're provided by the SDK in event handlers.

## Logging

The `logger` option is optional — if omitted, Chat SDK uses `ConsoleLogger("info")` by default. Each adapter also creates its own child logger automatically.

```typescript
// Use defaults (ConsoleLogger at "info" level)
const bot = new Chat({
  // ...
});

// Or set a specific log level
const bot = new Chat({
  // ...
  logger: "debug", // "debug" | "info" | "warn" | "error" | "silent"
});

// Or use a custom ConsoleLogger for child loggers
import { ConsoleLogger } from "chat";

const logger = new ConsoleLogger("info");
const bot = new Chat({
  // ...
  logger,
});
```

You can pass child loggers to adapters for prefixed log output, but adapters create their own child loggers by default:

```typescript
createSlackAdapter({
  logger: logger.child("slack"), // optional — auto-created if omitted
});
```

---

**Source:** https://chat-sdk.dev/docs/threads-messages-channels
