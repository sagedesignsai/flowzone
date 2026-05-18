# Task Context: Flowzone Agent Pipeline Integration

Session ID: 2026-05-17-flowzone-agent
Created: 2026-05-17
Status: in_progress

## Current Request
Complete the remaining implementation items for Flowzone's chat + agent pipeline, integrating the ToolLoopAgent with the frontend. Items: run prisma migration, create lib/tools/ with sandbox/git tool definitions, create lib/agents/flowzone-agent.ts, refactor app/api/chat/route.ts to use createAgentUIStreamResponse, and fix components/chat/chat-panel.tsx for AI SDK v6 API.

## Context Files (Standards to Follow)
- .opencode/context/core/standards/code-quality.md (modular, functional, pure functions, <50 lines, composition)
- .opencode/context/core/standards/security-patterns.md

## Reference Files (Source Material to Look At)
- package.json (deps: ai@6, @ai-sdk/react, @ai-sdk/anthropic, @ai-sdk/openai, e2b, @octokit/rest)
- types/index.ts (all git-related TypeScript interfaces)
- prisma/schema.prisma (GitRepo model, Chat git fields)
- lib/github.ts (Octokit GitHub service)
- lib/sandbox-git.ts (E2B sandbox git operations)
- app/api/chat/route.ts (current basic streamText route — needs refactor)
- app/api/github/* (existing GitHub API routes)
- components/chat/chat-panel.tsx (needs v6 fixes)
- components/chat/message-parts.tsx (already handles tool parts)

## External Docs Fetched
AI SDK v6 from node_modules/ai/docs/ + src/:
- ToolLoopAgent: constructor takes { model, instructions, tools, stopWhen }
- createAgentUIStreamResponse({ agent, uiMessages }): returns Response
- useChat v6: transport via DefaultChatTransport, sendMessage({ text }), no sendExtraMessageFields
- onFinish receives ({ message, messages, isAbort, isDisconnect, isError, finishReason })
- toDataStreamResponse deprecated → toUIMessageStreamResponse for useChat

## Components
1. Prisma migration — apply GitRepo schema
2. lib/tools/ — sandbox tool definitions + git tool definitions
3. lib/agents/flowzone-agent.ts — ToolLoopAgent with instructions + tools
4. app/api/chat/route.ts — refactor to createAgentUIStreamResponse
5. components/chat/chat-panel.tsx — fix AI SDK v6 API

## Constraints
- Must follow code-quality standards (pure functions, <50 lines, composition)
- E2B sandbox access pattern: AsyncLocalStorage for per-request sandbox context
- Tools are statically defined, sandbox/git context injected via AsyncLocalStorage
- Agent model: use installed provider SDKs (anthropic or openai fallback)
- Branch-per-chat format: "flowzone/{chatId}"

## Exit Criteria
- [ ] Prisma migration runs successfully
- [ ] lib/tools/sandbox.ts created with runCommand, writeFile, readFile, listFiles tools
- [ ] lib/tools/git.ts created with commitAndPush, getDiff, getStatus tools
- [ ] lib/tools/sandbox-store.ts created with AsyncLocalStorage context
- [ ] lib/agents/flowzone-agent.ts created with ToolLoopAgent + all tools
- [ ] app/api/chat/route.ts refactored to use createAgentUIStreamResponse
- [ ] components/chat/chat-panel.tsx fixed for v6 (DefaultChatTransport, sendMessage({ text }), no sendExtraMessageFields)
- [ ] Typecheck passes (tsc --noEmit)
