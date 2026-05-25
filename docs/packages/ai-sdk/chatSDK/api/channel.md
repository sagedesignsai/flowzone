# Channel

Channel container that holds threads, with methods for listing, posting, and iteration.

A `Channel` represents a channel or conversation container that holds threads.

## messages

Iterate channel-level messages (top-level, not thread replies) newest first. Auto-paginates lazily.

```typescript
for await (const msg of channel.messages) {
  console.log(msg.text);
}
```

## threads

Iterate threads in the channel, most recently active first. Returns lightweight `ThreadSummary` objects.

```typescript
for await (const thread of channel.threads()) {
  console.log(thread.rootMessage.text, thread.replyCount);
}
```

## post

Post a message to the channel top-level (not in a thread).

```typescript
await channel.post("Hello channel!");
await channel.post({ markdown: "**Announcement**: New release!" });
```

Accepts the same message formats as `thread.post()`.

## schedule

Schedule a message for future delivery to the channel top-level. Currently only supported by the Slack adapter.

```typescript
const scheduled = await channel.schedule("Weekly reminder: update your status!", {
  postAt: new Date("2026-03-10T09:00:00Z"),
});

// Cancel before it's sent
await scheduled.cancel();
```

## fetchMetadata

Fetch channel metadata from the platform.

```typescript
const info = await channel.fetchMetadata();
console.log(info.name, info.memberCount);
```

## state

Store typed, per-channel state. Works the same as thread state with a 30-day TTL.

```typescript
const state = await channel.state;
await channel.setState({ lastAnnouncement: new Date().toISOString() });
```

## postEphemeral

Post a message visible only to a specific user.

```typescript
await channel.postEphemeral(userId, "Only you can see this", {
  fallbackToDM: true,
});
```

## startTyping

Show a typing indicator. No-op on platforms that don't support it.

```typescript
await channel.startTyping();

// With custom status (Slack only)
await channel.startTyping("Searching documents...");
```

## mentionUser

Get a platform-specific @-mention string.

```typescript
await channel.post(`Hey ${channel.mentionUser(userId)}, check this out!`);
```

---

**Source:** https://chat-sdk.dev/docs/api/channel
