# Chat

The main entry point for creating a multi-platform chat bot.

The `Chat` class coordinates adapters, state, and event handlers. Create one instance and register handlers for different event types.

```typescript
import { Chat } from "chat";
```

## Constructor

```typescript
const bot = new Chat(config);
```

## Event handlers

### onNewMention

Fires when the bot is @-mentioned in a thread it has **not** subscribed to. This is the primary entry point for new conversations.

```typescript
bot.onNewMention(async (thread, message) => {
  await thread.subscribe();
  await thread.post("Hello!");
});
```

### onSubscribedMessage

Fires for every new message in a subscribed thread. Once subscribed, all messages (including @-mentions) route here instead of `onNewMention`.

```typescript
bot.onSubscribedMessage(async (thread, message) => {
  if (message.isMention) {
    // User @-mentioned us in a thread we're already watching
  }
  await thread.post(`Got: ${message.text}`);
});
```

### onNewMessage

Fires for messages matching a regex pattern in **unsubscribed** threads.

```typescript
bot.onNewMessage(/^!help/i, async (thread, message) => {
  await thread.post("Available commands: !help, !status");
});
```

### onReaction

Fires when a user adds or removes an emoji reaction.

```typescript
import { emoji } from "chat";

// Filter to specific emoji
bot.onReaction([emoji.thumbs_up, emoji.heart], async (event) => {
  if (event.added) {
    await event.thread.post(`Thanks for the ${event.emoji}!`);
  }
});

// Handle all reactions
bot.onReaction(async (event) => { /* ... */ });
```

### onAction

Fires when a user clicks a button or selects an option in a card.

```typescript
// Single action
bot.onAction("approve", async (event) => {
  await event.thread.post("Approved!");
});

// Multiple actions
bot.onAction(["approve", "reject"], async (event) => { /* ... */ });

// All actions
bot.onAction(async (event) => { /* ... */ });
```

### onModalSubmit

Fires when a user submits a modal form.

```typescript
bot.onModalSubmit("feedback", async (event) => {
  const comment = event.values.comment;
  if (event.relatedThread) {
    await event.relatedThread.post(`Feedback: ${comment}`);
  }
});
```

Returns `ModalResponse | undefined` to control the modal after submission.

### onSlashCommand

Fires when a user invokes a `/command` in the message composer. Currently supported on Slack.

```typescript
// Specific command
bot.onSlashCommand("/status", async (event) => {
  await event.channel.post("All systems operational!");
});

// Multiple commands
bot.onSlashCommand(["/help", "/info"], async (event) => {
  await event.channel.post(`You invoked ${event.command}`);
});

// Catch-all
bot.onSlashCommand(async (event) => {
  console.log(`${event.command} ${event.text}`);
});
```

### onModalClose

Fires when a user closes a modal (requires `notifyOnClose: true` on the modal).

```typescript
bot.onModalClose("feedback", async (event) => { /* ... */ });
```

## Utility methods

### webhooks

Type-safe webhook handlers keyed by adapter name. Pass these to your HTTP route handler.

```typescript
bot.webhooks.slack(request, { waitUntil });
bot.webhooks.teams(request, { waitUntil });
```

### getAdapter

Get an adapter instance by name.

```typescript
const slack = bot.getAdapter("slack");
```

### openDM

Open a direct message thread with a user.

```typescript
const dm = await bot.openDM("U123456");
await dm.post("Hello via DM!");

// Or with an Author object
const dm = await bot.openDM(message.author);
```

### channel

Get a Channel by its channel ID.

```typescript
const channel = bot.channel("slack:C123ABC");
for await (const msg of channel.messages) {
  console.log(msg.text);
}
```

### initialize / shutdown

Manually manage the lifecycle. Initialization happens automatically on the first webhook.

```typescript
await bot.initialize();
// ... do work ...
await bot.shutdown();
```

### reviver

Get a `JSON.parse` reviver that deserializes `Thread` and `Message` objects from workflow payloads.

```typescript
const data = JSON.parse(payload, bot.reviver());
await data.thread.post("Hello from workflow!");
```

---

**Source:** https://chat-sdk.dev/docs/api/chat
