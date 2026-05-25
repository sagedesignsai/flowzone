# Platform Adapters

Platform-specific adapters that connect your bot to any messaging platform.

Adapters handle webhook verification, message parsing, and API calls for each platform. Install only the adapters you need. Browse all available adapters — including community-built ones — on the Adapters page.

Ready to build your own? Follow the building guide.

## Feature matrix

### Messaging

| Feature | Slack | Teams | Google Chat | Discord | Telegram | GitHub | Linear | WhatsApp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Post message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| File uploads | ✅ | ✅ | ❌ | ✅ | ⚠️ Single file | ❌ | ❌ | ✅ Images, audio, docs |
| Streaming | ✅ Native | ⚠️ Post+Edit | ⚠️ Post+Edit | ⚠️ Post+Edit | ⚠️ Post+Edit | ❌ | ❌ | ❌ |
| Scheduled messages | ✅ Native | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Rich content

| Feature | Slack | Teams | Google Chat | Discord | Telegram | GitHub | Linear | WhatsApp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Card format | Block Kit | Adaptive Cards | Google Chat Cards | Embeds | Markdown + inline keyboard | GFM Markdown | Markdown | WhatsApp templates |
| Buttons | ✅ | ✅ | ✅ | ✅ | ⚠️ Inline keyboard | ❌ | ❌ | ✅ Interactive replies |
| Link buttons | ✅ | ✅ | ✅ | ✅ | ⚠️ Inline keyboard URLs | ❌ | ❌ | ❌ |
| Select menus | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tables | ✅ Block Kit | ✅ GFM | ⚠️ ASCII | ✅ GFM | ⚠️ ASCII | ✅ GFM | ✅ GFM | ❌ |
| Fields | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Template variables |
| Images in cards | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| Modals | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Conversations

| Feature | Slack | Teams | Google Chat | Discord | Telegram | GitHub | Linear | WhatsApp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Slash commands | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mentions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Add reactions | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Remove reactions | ✅ | ❌ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| Typing indicator | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| DMs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Ephemeral messages | ✅ Native | ❌ | ✅ Native | ❌ | ❌ | ❌ | ❌ | ❌ |

### Message history

| Feature | Slack | Teams | Google Chat | Discord | Telegram | GitHub | Linear | WhatsApp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fetch messages | ✅ | ✅ | ✅ | ✅ | ⚠️ Cached | ✅ | ✅ | ⚠️ Cached sent messages only |
| Fetch single message | ✅ | ❌ | ❌ | ❌ | ⚠️ Cached | ❌ | ❌ | ⚠️ Cached sent messages only |
| Fetch thread info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Fetch channel messages | ✅ | ✅ | ✅ | ✅ | ⚠️ Cached | ✅ | ❌ | ⚠️ Cached sent messages only |
| List threads | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Fetch channel info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Post channel message | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

⚠️ indicates partial support — the feature works with limitations.

## How adapters work

Each adapter implements a standard interface that the `Chat` class uses to route events and send messages. When a webhook arrives:

1. The adapter verifies the request signature
2. Parses the platform-specific payload into a normalized `Message`
3. Routes to your handlers via the `Chat` class
4. Converts outgoing messages from markdown/AST/cards to the platform's native format

## Using multiple adapters

Register multiple adapters and your event handlers work across all of them:

```typescript
import { Chat } from "chat";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createTeamsAdapter } from "@chat-adapter/teams";
import { createGoogleChatAdapter } from "@chat-adapter/gchat";
import { createRedisState } from "@chat-adapter/state-redis";

const bot = new Chat({
  userName: "mybot",
  adapters: {
    slack: createSlackAdapter(),
    teams: createTeamsAdapter(),
    gchat: createGoogleChatAdapter(),
  },
  state: createRedisState(),
});

// This handler fires for mentions on any platform
bot.onNewMention(async (thread) => {
  await thread.subscribe();
  await thread.post("Hello!");
});
```

Each adapter auto-detects credentials from environment variables, so you only need to pass config when overriding defaults.

Each adapter creates a webhook handler accessible via `bot.webhooks.`.

---

**Source:** https://chat-sdk.dev/docs/adapters
