# Handling Events

Register handlers for mentions, messages, reactions, member joins, and platform-specific events.

Chat SDK uses an event-driven architecture. You register handlers for different event types, and the SDK routes incoming webhooks to the appropriate handler.

## How routing works

When a message arrives, the SDK evaluates handlers in this order:

1. **Subscribed threads** — if the thread is subscribed, `onSubscribedMessage` fires and no other message handler runs.
2. **Mentions** — if the bot is @-mentioned in an unsubscribed thread, `onNewMention` fires.
3. **Pattern matches** — if the message text matches any `onNewMessage` regex patterns, those handlers fire.

Reactions, slash commands, actions, and modals have their own dedicated routing and are not affected by subscription state.

## Handling @-mentions

`onNewMention` fires when your bot is @-mentioned in a thread it hasn't subscribed to. This is the primary entry point for new conversations.

```typescript
bot.onNewMention(async (thread, message) => {
  await thread.subscribe();
  await thread.post("Hello! I'm now listening to this thread.");
});
```

The handler receives a `Thread` and a `Message`. Once you call `thread.subscribe()`, future messages in that thread route to `onSubscribedMessage` instead.

### When to use

* **AI assistants** — subscribe on first mention, then respond to all follow-up messages in the thread.
* **Ticket bots** — create a ticket when mentioned, then track the conversation.
* **One-shot commands** — respond to a mention without subscribing for bots that don't need ongoing context.

### Example: AI assistant with context

```typescript
bot.onNewMention(async (thread, message) => {
  await thread.subscribe();
  await thread.startTyping();
  const response = await generateAIResponse(message.text);
  await thread.post(response);
});
```

### Example: Triage bot

```typescript
bot.onNewMention(async (thread, message) => {
  const ticket = await createTicket({
    title: message.text.slice(0, 100),
    reporter: message.author.fullName,
  });
  await thread.post(`Ticket created: ${ticket.url}`);
});
```

## Handling subscribed messages

`onSubscribedMessage` fires for every new message in a thread your bot has subscribed to. Once subscribed, all messages (including @-mentions) route here instead of `onNewMention`.

```typescript
bot.onSubscribedMessage(async (thread, message) => {
  if (message.isMention) {
    await thread.post("You mentioned me!");
    return;
  }
  await thread.post(`Got your message: ${message.text}`);
});
```

Messages sent by the bot itself do not trigger this handler. You don't need to filter out your own messages.

### When to use

* **Conversational AI** — maintain a back-and-forth conversation with message history.
* **Thread monitoring** — watch a thread for updates and react to specific keywords or patterns.
* **Collaborative workflows** — track all messages in a thread to update external systems.

### Example: Conversational AI with history

```typescript
import { toAiMessages } from "chat";

bot.onSubscribedMessage(async (thread, message) => {
  await thread.startTyping();
  const messages = [];
  for await (const msg of thread.allMessages) {
    messages.push(msg);
  }
  const history = await toAiMessages(messages);
  const response = await generateAIResponse(history);
  await thread.post(response);
});
```

### Example: Unsubscribe on keyword

```typescript
bot.onSubscribedMessage(async (thread, message) => {
  if (message.text.toLowerCase().includes("stop")) {
    await thread.unsubscribe();
    await thread.post("Got it, I'll stop watching this thread.");
    return;
  }
  // Handle other messages...
});
```

## Handling pattern matches

`onNewMessage` fires for messages matching a regex pattern in threads the bot is **not** subscribed to. Use it for keyword-triggered responses without requiring an @-mention.

```typescript
bot.onNewMessage(/^help$/i, async (thread, message) => {
  await thread.post("Here's how I can help...");
});
```

The first argument is a `RegExp` that's tested against the message text. Only messages in unsubscribed threads are evaluated.

### When to use

* **Keyword triggers** — respond to specific words or phrases without requiring a mention.
* **Auto-responders** — detect common questions and provide instant answers.
* **Escalation detection** — watch for urgent language and alert the right people.

### Example: FAQ auto-responder

```typescript
bot.onNewMessage(/\b(deploy|deployment|ship)\b/i, async (thread, message) => {
  await thread.post(
    "Deployments run automatically on push to `main`. " +
    "Check status at https://dashboard.example.com/deploys"
  );
});
```

### Example: Incident detection

```typescript
bot.onNewMessage(/\b(outage|down|incident|p[01])\b/i, async (thread, message) => {
  await thread.subscribe();
  await thread.post(
    "I've flagged this as a potential incident and I'm monitoring this thread."
  );
  await notifyOnCallTeam({
    channel: thread.channel.id,
    reporter: message.author.fullName,
    text: message.text,
  });
});
```

## Handling reactions

`onReaction` fires when users add or remove emoji reactions to messages. You can handle all reactions or filter by specific emoji.

```typescript
import { emoji } from "chat";

// Handle specific emoji
bot.onReaction(["thumbs_up", "heart"], async (event) => {
  if (!event.added) return;
  await event.adapter.addReaction(
    event.threadId,
    event.messageId,
    emoji.raised_hands
  );
});

// Handle all reactions
bot.onReaction(async (event) => {
  console.log(`${event.user.userName} ${event.added ? "added" : "removed"} ${event.emoji}`);
});
```

### ReactionEvent

| Property | Type | Description |
| --- | --- | --- |
| `emoji` | `EmojiValue` | Normalized emoji name for cross-platform comparison |
| `rawEmoji` | `string` | Platform-specific emoji string |
| `added` | `boolean` | `true` if added, `false` if removed |
| `user` | `Author` | The user who reacted |
| `message` | `Message` (optional) | The message that was reacted to |
| `thread` | `Thread` | Thread for posting replies |
| `messageId` | `string` | ID of the message that was reacted to |
| `threadId` | `string` | Thread ID |
| `adapter` | `Adapter` | The platform adapter |
| `raw` | `unknown` | Platform-specific event payload |

### When to use

* **Approval workflows** — use thumbs up/down as lightweight approve/reject signals.
* **Bookmarking** — save messages to an external system when a specific emoji is added.
* **Polls and voting** — count reactions as votes.

### Example: Approval workflow

```typescript
bot.onReaction(["thumbs_up", "thumbs_down"], async (event) => {
  if (!event.added) return;
  const approved = event.emoji === "thumbs_up";
  const status = approved ? "approved" : "rejected";
  await event.thread.post(`Request ${status} by ${event.user.fullName}`);
  await updateRequestStatus(event.messageId, status, event.user.userId);
});
```

## Handling interactions

For button clicks, slash commands, and modal forms, see the dedicated guides:

* **[Slash Commands](/docs/slash-commands)** — handle `/command` invocations from the message composer.
* **[Actions](/docs/actions)** — handle button clicks and interactive card events.
* **[Modals](/docs/modals)** — collect structured input through modal dialogs with validation.

## Handling Slack-specific events

These handlers are specific to the Slack platform and require the Slack adapter.

### Handling assistant threads

`onAssistantThreadStarted` fires when a user opens a new assistant thread in Slack. Use it with the Slack Assistants API to set suggested prompts and status indicators.

```typescript
bot.onAssistantThreadStarted(async (event) => {
  const slack = bot.getAdapter("slack") as SlackAdapter;
  await slack.setSuggestedPrompts(event.channelId, event.threadTs, [
    { title: "Get started", message: "What can you help me with?" },
    { title: "Summarize", message: "Summarize the current channel" },
  ]);
});
```

### Handling App Home opens

`onAppHomeOpened` fires when a user opens your bot's Home tab in Slack. Use it to publish a dynamic view.

```typescript
bot.onAppHomeOpened(async (event) => {
  const slack = bot.getAdapter("slack") as SlackAdapter;
  await slack.publishHomeView(event.userId, {
    type: "home",
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `Welcome, <@${event.userId}>!` },
      },
    ],
  });
});
```

### Handling member joined channel

`onMemberJoinedChannel` fires when a user joins a Slack channel. Use it to post welcome messages or onboard users automatically.

```typescript
bot.onMemberJoinedChannel(async (event) => {
  if (event.userId !== event.adapter.botUserId) {
    return;
  }
  await event.adapter.postMessage(
    event.channelId,
    "Hello! I'm now available in this channel. Mention me to get started."
  );
});
```

---

**Source:** https://chat-sdk.dev/docs/handling-events
