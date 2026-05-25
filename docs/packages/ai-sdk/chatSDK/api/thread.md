# Thread

Represents a conversation thread with methods for posting, subscribing, and state management.

A `Thread` is provided to your event handlers and represents a conversation thread on any platform.

## post

Post a message to the thread. Accepts strings, structured messages, cards, and streams.

```typescript
await thread.post("Hello!");
await thread.post({ markdown: "**Bold** text" });
await thread.post({ ast: root([paragraph([text("Hello")])]) });
await thread.post(Card({ title: "Hi", children: [Text("Hello")] }));
await thread.post(result.fullStream);
```

Returns `Promise` — the sent message with `edit()`, `delete()`, `addReaction()`, and `removeReaction()` methods.

## postEphemeral

Post a message visible only to a specific user.

```typescript
await thread.postEphemeral(userId, "Only you can see this", {
  fallbackToDM: true,
});
```

## schedule

Schedule a message for future delivery. Currently only supported by the Slack adapter.

```typescript
const scheduled = await thread.schedule("Reminder: standup in 5 minutes!", {
  postAt: new Date("2026-03-09T09:00:00Z"),
});

// Cancel before it's sent
await scheduled.cancel();
```

## subscribe / unsubscribe

Manage thread subscriptions. Subscribed threads route all messages to `onSubscribedMessage` handlers.

```typescript
await thread.subscribe();
await thread.unsubscribe();
const subscribed = await thread.isSubscribed();
```

Subscriptions persist across restarts via your state adapter.

## state

Store typed, per-thread state that persists across requests. State has a 30-day TTL.

```typescript
// Read state
const state = await thread.state; // TState | null

// Merge into existing state
await thread.setState({ aiMode: true });

// Replace state entirely
await thread.setState({ aiMode: false }, { replace: true });
```

## startTyping

Show a typing indicator in the thread. No-op on platforms that don't support it.

```typescript
await thread.startTyping();

// With custom status (Slack only)
await thread.startTyping("Searching documents...");
```

## messages / allMessages

Iterate through message history.

```typescript
// Newest first (auto-paginates)
for await (const msg of thread.messages) {
  console.log(msg.text);
}

// Oldest first (auto-paginates)
for await (const msg of thread.allMessages) {
  console.log(msg.text);
}
```

## refresh

Re-fetch messages from the API and update `recentMessages`.

```typescript
await thread.refresh();
```

## mentionUser

Get a platform-specific @-mention string for a user.

```typescript
await thread.post(`Hey ${thread.mentionUser(userId)}, check this out!`);
```

---

**Source:** https://chat-sdk.dev/docs/api/thread
