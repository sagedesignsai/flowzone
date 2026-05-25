# Agent Memory

## Overview

Memory lets your agent save information and recall it later. Without memory, every conversation starts fresh. With memory, your agent builds context over time, recalls previous interactions, and adapts to the user.

## Three Approaches

You can add memory to your agent in three ways, each with different tradeoffs:

| Approach | Effort | Flexibility | Provider Lock-in |
| --- | --- | --- | --- |
| Provider-Defined Tools | Low | Medium | Yes |
| Memory Providers | Low | Low | Depends on memory provider |
| Custom Tool | High | High | No |

## Provider-Defined Tools

Provider-defined tools are tools where the provider specifies the tool's `inputSchema` and `description`, but you provide the `execute` function. The model has been trained to use these tools, which can result in better performance.

### Anthropic Memory Tool

The Anthropic Memory Tool gives Claude a structured interface for managing a `/memories` directory. Claude reads its memory before starting tasks, creates and updates files as it works, and references them in future conversations.

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { ToolLoopAgent } from 'ai';

const memory = anthropic.tools.memory_20250818({
  execute: async action => {
    // `action` contains `command`, `path`, and other fields
    // depending on the command (view, create, str_replace,
    // insert, delete, rename).
    // Implement your storage backend here.
    // Return the result as a string.
  },
});

const agent = new ToolLoopAgent({
  model: 'anthropic/claude-haiku-4.5',
  tools: { memory },
});

const result = await agent.generate({
  prompt: 'Remember that my favorite editor is Neovim',
});
```

The tool receives structured commands (`view`, `create`, `str_replace`, `insert`, `delete`, `rename`), each with a `path` scoped to `/memories`. Your `execute` function maps these to your storage backend (filesystem, database, or other persistence layer).

**When to use this**: You want memory with minimal implementation effort and are already using Anthropic models. The tradeoff is provider lock-in.

## Memory Providers

Use a provider that has memory built in. These providers wrap an external memory service and expose it through the AI SDK's standard interface.

### Letta

Letta provides agents with persistent long-term memory. You create an agent on Letta's platform (cloud or self-hosted), configure its memory there, and use the AI SDK provider to interact with it.

```bash
pnpm add @letta-ai/vercel-ai-sdk-provider
```

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: lettaCloud(),
  providerOptions: {
    letta: {
      agent: { id: 'your-agent-id' },
    },
  },
});

const result = await agent.generate({
  prompt: 'Remember that my favorite editor is Neovim',
});
```

You can also use Letta's built-in memory tools:

```typescript
import { lettaCloud } from '@letta-ai/vercel-ai-sdk-provider';
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: lettaCloud(),
  tools: {
    core_memory_append: lettaCloud.tool('core_memory_append'),
    memory_insert: lettaCloud.tool('memory_insert'),
    memory_replace: lettaCloud.tool('memory_replace'),
  },
  providerOptions: {
    letta: {
      agent: { id: 'your-agent-id' },
    },
  },
});

const stream = agent.stream({
  prompt: 'What do you remember about me?',
});
```

### Mem0

Mem0 adds a memory layer on top of any supported LLM provider. It automatically extracts memories from conversations, stores them, and retrieves relevant ones for future prompts.

```bash
pnpm add @mem0/vercel-ai-provider
```

```typescript
import { createMem0 } from '@mem0/vercel-ai-provider';
import { ToolLoopAgent } from 'ai';

const mem0 = createMem0({
  provider: 'openai',
  mem0ApiKey: process.env.MEM0_API_KEY,
  apiKey: process.env.OPENAI_API_KEY,
});

const agent = new ToolLoopAgent({
  model: mem0('gpt-4.1', { user_id: 'user-123' }),
});

const { text } = await agent.generate({
  prompt: 'Remember that my favorite editor is Neovim',
});
```

Mem0 works across multiple LLM providers (OpenAI, Anthropic, Google, Groq, Cohere). You can also manage memories explicitly:

```typescript
import { addMemories, retrieveMemories } from '@mem0/vercel-ai-provider';

await addMemories(messages, { user_id: 'user-123' });

const context = await retrieveMemories(prompt, { user_id: 'user-123' });
```

### Supermemory

Supermemory is a long-term memory platform that adds persistent, self-growing memory to your AI applications. It provides tools that handle saving and retrieving memories automatically through semantic search.

```bash
pnpm add @supermemory/tools
```

```typescript
import { supermemoryTools } from '@supermemory/tools/ai-sdk';
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: supermemoryTools(process.env.SUPERMEMORY_API_KEY!),
});

const result = await agent.generate({
  prompt: 'Remember that my favorite editor is Neovim',
});
```

Supermemory works with any AI SDK provider. The tools give the model `addMemory` and `searchMemories` operations.

**When to use memory providers**: You want memory without building any storage infrastructure. The tradeoff is that the provider controls memory behavior, so you have less visibility into what gets stored and how it is retrieved.

## Custom Tool

Building your own memory tool from scratch is the most flexible approach. You control the storage format, the interface, and the retrieval logic. This requires the most upfront work but gives you full ownership of how memory works, with no provider lock-in and no external dependencies.

There are two common patterns:

- **Structured actions** - Define explicit operations (`view`, `create`, `update`, `search`) and handle structured input yourself. Safe by design since you control every operation.
- **Bash-backed** - Give the model a sandboxed bash environment to compose shell commands (`cat`, `grep`, `sed`, `echo`) for flexible memory access. More powerful but requires command validation for safety.

For a full walkthrough of implementing a custom memory tool with a bash-backed interface, AST-based command validation, and filesystem persistence, see the **Build a Custom Memory Tool** recipe.

---

**Source:** [Agent Memory - AI SDK](https://ai-sdk.dev/docs/agents/memory)
