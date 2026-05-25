# Getting Started

Pick a guide to start building with Chat SDK.

## Usage

Learn the core patterns for handling incoming events and posting messages back to your users.

- **[Creating a Chat Instance](/docs/usage)** - Initialize the Chat class with adapters, state, and configuration options.
- **[Threads, Messages, and Channels](/docs/threads-messages-channels)** - Work with threads, messages, and channels across platforms.
- **[Handling Events](/docs/handling-events)** - Register handlers for mentions, messages, reactions, and platform-specific events.
- **[Posting Messages](/docs/posting-messages)** - Different ways to render and send messages with thread.post().

## Adapters

Connect your bot to chat platforms and persist state across restarts.

- **[Platform Adapters](/docs/adapters)** - Platform-specific adapters for Slack, Teams, Google Chat, Discord, Telegram, GitHub, and Linear.
- **[State Adapters](/docs/state)** - Pluggable state adapters for thread subscriptions, distributed locking, and caching.

## Guides

Step-by-step tutorials to get up and running on your platform of choice.

- **[Slack bot with Next.js and Redis](/docs/guides/slack-nextjs)** - Build a Slack bot from scratch using Chat SDK, Next.js, and Redis.
- **[Durable chat sessions with Next.js, Workflow, and Redis](/docs/guides/durable-chat-sessions-nextjs)** - Build a bot whose thread sessions survive restarts by combining Chat SDK with Workflow.
- **[Schedule Slack posts with Next.js, Workflow, and Neon](/docs/guides/scheduled-posts-neon)** - Build durable scheduled posts backed by Neon and Workflow timers.
- **[Code review GitHub bot with Hono and Redis](/docs/guides/code-review-hono)** - Build a GitHub bot that reviews pull requests using AI SDK, Vercel Sandbox, and Chat SDK.
- **[Discord support bot with Nuxt and Redis](/docs/guides/discord-nuxt)** - Build a Discord support bot using Chat SDK, Nuxt, and AI SDK.

---

**Source:** https://chat-sdk.dev/docs/getting-started
