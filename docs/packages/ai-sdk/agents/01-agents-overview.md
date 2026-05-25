# AI SDK Agents - Overview

## What Are Agents?

Agents are **large language models (LLMs)** that use **tools** in a **loop** to accomplish tasks. They combine three key components:

- **LLMs** - Process input and decide the next action
- **Tools** - Extend capabilities beyond text generation (reading files, calling APIs, writing to databases)
- **Loop** - Orchestrates execution through context management and stopping conditions

## ToolLoopAgent Class

The `ToolLoopAgent` class handles all three components. It's the recommended approach for building agents with the AI SDK.

### Basic Example

```typescript
import { ToolLoopAgent, stepCountIs, tool } from 'ai';
import { z } from 'zod';

const weatherAgent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    weather: tool({
      description: 'Get the weather in a location (in Fahrenheit)',
      inputSchema: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
    convertFahrenheitToCelsius: tool({
      description: 'Convert temperature from Fahrenheit to Celsius',
      inputSchema: z.object({
        temperature: z.number().describe('Temperature in Fahrenheit'),
      }),
      execute: async ({ temperature }) => {
        const celsius = Math.round((temperature - 32) * (5 / 9));
        return { celsius };
      },
    }),
  },
});

const result = await weatherAgent.generate({
  prompt: 'What is the weather in San Francisco in celsius?',
});

console.log(result.text); // agent's final answer
console.log(result.steps); // steps taken by the agent
```

### How It Works

The agent automatically:
1. Calls the `weather` tool to get the temperature in Fahrenheit
2. Calls `convertFahrenheitToCelsius` to convert it
3. Generates a final text response with the result

## Why Use the Agent Class?

The Agent class is recommended because it:

- **Reduces boilerplate** - Manages loops and message arrays
- **Improves reusability** - Define once, use throughout your application
- **Simplifies maintenance** - Single place to update agent configuration

## Structured Workflows

Agents are flexible and powerful, but non-deterministic. When you need reliable, repeatable outcomes with explicit control flow, use core functions with structured workflow patterns combining:

- Conditional statements for explicit branching
- Standard functions for reusable logic
- Error handling for robustness
- Explicit control flow for predictability

## Next Steps

- **[Building Agents](/docs/agents/building-agents)** - Guide to creating agents with the Agent class
- **[Workflow Patterns](/docs/agents/workflows)** - Structured patterns using core functions for complex workflows
- **[Loop Control](/docs/agents/loop-control)** - Execution control with stopWhen and prepareStep

---

**Source:** [AI SDK Agents Overview](https://ai-sdk.dev/docs/agents/overview)
