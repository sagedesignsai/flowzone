# Loop Control

## Overview

You can control both the execution flow and the settings at each step of the agent loop. The loop continues until:

- A finish reasoning other than tool-calls is returned
- A tool that is invoked does not have an execute function
- A tool call needs approval
- A stop condition is met

The AI SDK provides built-in loop control through two parameters:
- `stopWhen` - Define stopping conditions
- `prepareStep` - Modify settings between steps

## Stop Conditions

The `stopWhen` parameter controls when to stop execution. By default, agents stop after 20 steps using `stepCountIs(20)`.

### Use Built-in Conditions

```typescript
import { ToolLoopAgent, stepCountIs } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    // your tools
  },
  stopWhen: stepCountIs(20), // Default state: stop after 20 steps maximum
});

const result = await agent.generate({
  prompt: 'Analyze this dataset and create a summary report',
});
```

### Combine Multiple Conditions

The loop stops when it meets any condition:

```typescript
import { ToolLoopAgent, stepCountIs, hasToolCall } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    // your tools
  },
  stopWhen: [
    stepCountIs(20), // Maximum 20 steps
    hasToolCall('someTool'), // Stop after calling 'someTool'
  ],
});

const result = await agent.generate({
  prompt: 'Research and analyze the topic',
});
```

### Create Custom Conditions

Build custom stopping conditions for specific requirements:

```typescript
import { ToolLoopAgent, StopCondition, ToolSet } from 'ai';

const tools = {
  // your tools
} satisfies ToolSet;

const hasAnswer: StopCondition<typeof tools> = ({ steps }) => {
  // Stop when the model generates text containing "ANSWER:"
  return steps.some(step => step.text?.includes('ANSWER:')) ?? false;
};

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools,
  stopWhen: hasAnswer,
});

const result = await agent.generate({
  prompt: 'Find the answer and respond with "ANSWER: [your answer]"',
});
```

Custom conditions can access step information across all steps:

```typescript
const budgetExceeded: StopCondition<typeof tools> = ({ steps }) => {
  const totalUsage = steps.reduce(
    (acc, step) => ({
      inputTokens: acc.inputTokens + (step.usage?.inputTokens ?? 0),
      outputTokens: acc.outputTokens + (step.usage?.outputTokens ?? 0),
    }),
    { inputTokens: 0, outputTokens: 0 },
  );

  const costEstimate =
    (totalUsage.inputTokens * 0.01 + totalUsage.outputTokens * 0.03) / 1000;

  return costEstimate > 0.5; // Stop if cost exceeds $0.50
};
```

## Prepare Step

The `prepareStep` callback runs before each step in the loop. Use it to modify settings, manage context, or implement dynamic behavior based on execution history.

### Dynamic Model Selection

Switch models based on step requirements:

```typescript
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: 'openai/gpt-4o-mini', // Default model
  tools: {
    // your tools
  },
  prepareStep: async ({ stepNumber, messages }) => {
    // Use a stronger model for complex reasoning after initial steps
    if (stepNumber > 2 && messages.length > 10) {
      return {
        model: "anthropic/claude-sonnet-4.5",
      };
    }

    // Continue with default settings
    return {};
  },
});

const result = await agent.generate({
  prompt: '...',
});
```

### Context Management

Manage growing conversation history in long-running loops:

```typescript
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    // your tools
  },
  prepareStep: async ({ messages }) => {
    // Keep only recent messages to stay within context limits
    if (messages.length > 20) {
      return {
        messages: [
          messages[0], // Keep system instructions
          ...messages.slice(-10), // Keep last 10 messages
        ],
      };
    }

    return {};
  },
});

const result = await agent.generate({
  prompt: '...',
});
```

### Tool Selection

Control which tools are available at each step:

```typescript
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    search: searchTool,
    analyze: analyzeTool,
    summarize: summarizeTool,
  },
  prepareStep: async ({ stepNumber, steps }) => {
    // Search phase (steps 0-2)
    if (stepNumber <= 2) {
      return {
        activeTools: ['search'],
        toolChoice: 'required',
      };
    }

    // Analysis phase (steps 3-5)
    if (stepNumber <= 5) {
      return {
        activeTools: ['analyze'],
      };
    }

    // Summary phase (step 6+)
    return {
      activeTools: ['summarize'],
      toolChoice: 'required',
    };
  },
});

const result = await agent.generate({
  prompt: '...',
});
```

Force a specific tool to be used:

```typescript
prepareStep: async ({ stepNumber }) => {
  if (stepNumber === 0) {
    // Force the search tool to be used first
    return {
      toolChoice: { type: 'tool', toolName: 'search' },
    };
  }

  if (stepNumber === 5) {
    // Force the summarize tool after analysis
    return {
      toolChoice: { type: 'tool', toolName: 'summarize' },
    };
  }

  return {};
};
```

### Message Modification

Transform messages before sending them to the model:

```typescript
import { ToolLoopAgent } from 'ai';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    // your tools
  },
  prepareStep: async ({ messages, stepNumber }) => {
    // Summarize tool results to reduce token usage
    const processedMessages = messages.map(msg => {
      if (msg.role === 'tool' && msg.content.length > 1000) {
        return {
          ...msg,
          content: summarizeToolResult(msg.content),
        };
      }

      return msg;
    });

    return { messages: processedMessages };
  },
});

const result = await agent.generate({
  prompt: '...',
});
```

## Access Step Information

Both `stopWhen` and `prepareStep` receive detailed information about the current execution:

```typescript
prepareStep: async ({
  model, // Current model configuration
  stepNumber, // Current step number (0-indexed)
  steps, // All previous steps with their results
  messages, // Messages to be sent to the model
}) => {
  // Access previous tool calls and results
  const previousToolCalls = steps.flatMap(step => step.toolCalls);
  const previousResults = steps.flatMap(step => step.toolResults);

  // Make decisions based on execution history
  if (previousToolCalls.some(call => call.toolName === 'dataAnalysis')) {
    return {
      toolChoice: { type: 'tool', toolName: 'reportGenerator' },
    };
  }

  return {};
};
```

## Forced Tool Calling

Force the agent to always use tools by combining `toolChoice: 'required'` with a `done` tool that has no `execute` function:

```typescript
import { ToolLoopAgent, tool } from 'ai';
import { z } from 'zod';

const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  tools: {
    search: searchTool,
    analyze: analyzeTool,
    done: tool({
      description: 'Signal that you have finished your work',
      inputSchema: z.object({
        answer: z.string().describe('The final answer'),
      }),
      // No execute function - stops the agent when called
    }),
  },
  toolChoice: 'required', // Force tool calls at every step
});

const result = await agent.generate({
  prompt: 'Research and analyze this topic, then provide your answer.',
});

// extract answer from done tool call
const toolCall = result.staticToolCalls[0]; // tool call from final step

if (toolCall?.toolName === 'done') {
  console.log(toolCall.input.answer);
}
```

Key aspects of this pattern:

- **`toolChoice: 'required'`** - Forces the model to call a tool at every step
- **`done` tool without `execute`** - Acts as a termination signal
- **Accessing results** - Available in `result.staticToolCalls`

## Manual Loop Control

For complete control over the agent loop, use AI SDK Core functions (`generateText` and `streamText`):

```typescript
import { generateText, ModelMessage } from 'ai';

const messages: ModelMessage[] = [{ role: 'user', content: '...' }];

let step = 0;
const maxSteps = 10;

while (step < maxSteps) {
  const result = await generateText({
    model: "anthropic/claude-sonnet-4.5",
    messages,
    tools: {
      // your tools here
    },
  });

  messages.push(...result.response.messages);

  if (result.text) {
    break; // Stop when model generates text
  }

  step++;
}
```

This manual approach gives you complete control over:
- Message history management
- Step-by-step decision making
- Custom stopping conditions
- Dynamic tool and model selection
- Error handling and recovery

---

**Source:** [Loop Control - AI SDK](https://ai-sdk.dev/docs/agents/loop-control)
