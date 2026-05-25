# Building Agents with AI SDK

## Overview

The `ToolLoopAgent` class provides a structured way to encapsulate LLM configuration, tools, and behavior into reusable components. It handles the agent loop automatically, allowing the LLM to call tools multiple times in sequence to accomplish complex tasks.

## Why Use ToolLoopAgent?

When building AI applications, you often need to:

- **Reuse configurations** - Same model settings, tools, and prompts across different parts of your application
- **Maintain consistency** - Ensure the same behavior and capabilities throughout your codebase
- **Simplify API routes** - Reduce boilerplate in your endpoints
- **Type safety** - Get full TypeScript support for your agent's tools and outputs

## Creating an Agent

Define an agent by instantiating the `ToolLoopAgent` class:

```typescript
import { ToolLoopAgent } from 'ai';

const myAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  instructions: 'You are a helpful assistant.',
  tools: {
    // Your tools here
  },
});
```

## Configuration Options

### Model and System Instructions

```typescript
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  instructions: 'You are an expert software engineer.',
});
```

### Tools

Provide tools that the agent can use:

```typescript
import { ToolLoopAgent, tool } from 'ai';
import { z } from 'zod';

const codeAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    runCode: tool({
      description: 'Execute Python code',
      inputSchema: z.object({
        code: z.string(),
      }),
      execute: async ({ code }) => {
        // Execute code and return result
        return { output: 'Code executed successfully' };
      },
    }),
  },
});
```

### Loop Control

By default, agents run for 20 steps. Configure `stopWhen` to allow more steps:

```typescript
import { ToolLoopAgent, stepCountIs } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  stopWhen: stepCountIs(20), // Allow up to 20 steps
});
```

Combine multiple conditions:

```typescript
import { ToolLoopAgent, stepCountIs } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  stopWhen: [
    stepCountIs(20), // Maximum 20 steps
    yourCustomCondition(), // Custom logic for when to stop
  ],
});
```

### Tool Choice

Control how the agent uses tools:

```typescript
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    // your tools here
  },
  toolChoice: 'required', // Force tool use
  // or toolChoice: 'none' to disable tools
  // or toolChoice: 'auto' (default) to let the model decide
});
```

Force a specific tool:

```typescript
const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    weather: weatherTool,
    cityAttractions: attractionsTool,
  },
  toolChoice: {
    type: 'tool',
    toolName: 'weather', // Force the weather tool to be used
  },
});
```

### Structured Output

Define structured output schemas:

```typescript
import { ToolLoopAgent, Output, stepCountIs } from 'ai';
import { z } from 'zod';

const analysisAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  output: Output.object({
    schema: z.object({
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      summary: z.string(),
      keyPoints: z.array(z.string()),
    }),
  }),
  stopWhen: stepCountIs(10),
});

const { output } = await analysisAgent.generate({
  prompt: 'Analyze customer feedback from the last quarter',
});
```

## Define Agent Behavior with System Instructions

System instructions define your agent's behavior, personality, and constraints.

### Basic System Instructions

```typescript
const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  instructions: 'You are an expert data analyst. You provide clear insights from complex data.',
});
```

### Detailed Behavioral Instructions

```typescript
const codeReviewAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  instructions: `You are a senior software engineer conducting code reviews.
Your approach:
- Focus on security vulnerabilities first
- Identify performance bottlenecks
- Suggest improvements for readability and maintainability
- Be constructive and educational in your feedback
- Always explain why something is an issue and how to fix it`,
});
```

### Constrain Agent Behavior

```typescript
const customerSupportAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  instructions: `You are a customer support specialist for an e-commerce platform.
Rules:
- Never make promises about refunds without checking the policy
- Always be empathetic and professional
- If you don't know something, say so and offer to escalate
- Keep responses concise and actionable
- Never share internal company information`,
  tools: {
    checkOrderStatus,
    lookupPolicy,
    createTicket,
  },
});
```

## Using an Agent

### Generate Text

Use `generate()` for one-time text generation:

```typescript
const result = await myAgent.generate({
  prompt: 'What is the weather like?',
});

console.log(result.text);
```

### Stream Text

Use `stream()` for streaming responses:

```typescript
const result = await myAgent.stream({
  prompt: 'Tell me a story',
});

for await (const chunk of result.textStream) {
  console.log(chunk);
}
```

### Respond to UI Messages

Use `createAgentUIStreamResponse()` for client applications:

```typescript
// In your API route (e.g., app/api/chat/route.ts)
import { createAgentUIStreamResponse } from 'ai';

export async function POST(request: Request) {
  const { messages } = await request.json();

  return createAgentUIStreamResponse({
    agent: myAgent,
    uiMessages: messages,
  });
}
```

### Track Step Progress

Use `onStepFinish` to track each step's progress:

```typescript
const result = await myAgent.generate({
  prompt: 'Research and summarize the latest AI trends',
  onStepFinish: async ({ usage, finishReason, toolCalls }) => {
    console.log('Step completed:', {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      finishReason,
      toolsUsed: toolCalls?.map(tc => tc.toolName),
    });
  },
});
```

## End-to-end Type Safety

Infer types for your agent's `UIMessage`s:

```typescript
import { ToolLoopAgent, InferAgentUIMessage } from 'ai';

const myAgent = new ToolLoopAgent({
  // ... configuration
});

// Infer the UIMessage type for UI components or persistence
export type MyAgentUIMessage = InferAgentUIMessage<typeof myAgent>;
```

Use this type in your client components:

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import type { MyAgentUIMessage } from '@/agent/my-agent';

export function Chat() {
  const { messages } = useChat<MyAgentUIMessage>();
  // Full type safety for your messages and tools
}
```

## Next Steps

- Explore [workflow patterns](/docs/agents/workflows) for structured patterns using core functions
- Learn about [loop control](/docs/agents/loop-control) for advanced execution control
- See [manual loop examples](/cookbook/node/manual-agent-loop) for custom workflow implementations

---

**Source:** [Building Agents - AI SDK](https://ai-sdk.dev/docs/agents/building-agents)
