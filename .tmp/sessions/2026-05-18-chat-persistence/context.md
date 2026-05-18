# Task Context: Chat Persistence

Session ID: 2026-05-18-chat-persistence
Created: 2026-05-18T10:00:00Z
Status: completed

## Current Request
Implement chat message persistence. Use the AI SDK message formats and ToolLoopAgents. Do web research if necessary.

## Context Files (Standards to Follow)
- .opencode/context/core/standards/code-quality.md
- ~/.agents/skills/ai-sdk-ui/references/use-chat-migration.md (understood from research)
- ~/.agents/skills/ai-sdk/references/type-safe-agents.md (understood from research)

## Reference Files (Source Material to Look At)
- package.json
- prisma/schema.prisma
- lib/agents/flowzone-agent.ts
- app/api/chat/route.ts
- app/chat/[id]/page.tsx
- components/chat/chat-panel.tsx
- types/index.ts

## External Docs Fetched
- AI SDK v6 `createAgentUIStreamResponse` source code
- AI SDK v6 `ToolLoopAgent` source code
- AI SDK v6 `UIMessage` interface definition
- AI SDK v6 docs: `04-ai-sdk-ui/03-chatbot-message-persistence.mdx`

## Components
1. `lib/chat/store.ts` - Database operations for saving and loading messages
2. `app/api/chat/route.ts` - Streaming response with onFinish callback for persistence
3. `app/chat/[id]/page.tsx` - Server-side fetching of initial messages
4. `components/chat/chat-panel.tsx` - Client-side state hydration with initialMessages
5. `lib/ai/models.ts` - Centralized AI provider with cost-effective models (Gemini 3 Flash / Flash Lite / Qwen Coder)
6. `app/api/chat/[id]/title/route.ts` - Tool-call based title generation API

## Constraints
- Use Prisma for database interactions.
- Maintain Next.js App Router conventions (server components where possible).
- Use `UIMessage[]` for the message state.
- Ensure the chat ID exists in the database before attempting to save messages to it.
- Follow the modular, functional code quality standard.

## Exit Criteria
- [ ] `lib/chat/store.ts` is implemented
- [ ] `app/api/chat/route.ts` correctly saves messages on finish
- [ ] `app/chat/[id]/page.tsx` loads messages from DB
- [ ] `components/chat/chat-panel.tsx` handles initialMessages
- [ ] Unknown chat IDs automatically create a new Chat in the DB
- [x] `lib/ai/models.ts` centralizes provider config with cost-effective models
- [x] `app/api/chat/[id]/title/route.ts` generates titles via tool calls
- [ ] Build typecheck passes (times out — large project)