# AI SDK Agents Documentation

Complete guide to building agents with the Vercel AI SDK.

## Quick Navigation

### Fundamentals
- [Overview](./01-agents-overview.md) - What agents are and why to use them
- [Building Agents](./02-building-agents.md) - Creating and configuring agents

### Advanced Topics
- [Loop Control](./04-loop-control.md) - Control execution flow with stopWhen and prepareStep
- [Call Options](./03-configuring-call-options.md) - Dynamic runtime configuration
- [Memory](./05-memory.md) - Adding persistent memory to agents
- [Subagents](./07-subagents.md) - Delegating tasks to specialized agents

### Patterns & Workflows
- [Workflow Patterns](./06-workflow-patterns.md) - Sequential, parallel, routing, orchestration, and evaluation patterns

## Key Concepts

### ToolLoopAgent
The main class for building agents. Handles the agent loop, context management, and stopping conditions.

```typescript
const agent = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-4.5",
  instructions: 'You are a helpful assistant.',
  tools: { /* your tools */ },
});
```

### Three Core Components
1. **LLMs** - Process input and decide actions
2. **Tools** - Extend capabilities (APIs, file access, databases)
3. **Loop** - Orchestrates execution with context management and stopping conditions

## Common Patterns

| Pattern | Use Case |
| --- | --- |
| Sequential | Well-defined step-by-step processes |
| Parallel | Independent concurrent tasks |
| Routing | Different paths based on context |
| Orchestration | Coordinating multiple specialized agents |
| Evaluation | Quality control with feedback loops |

## Getting Started

1. Start with [Overview](./01-agents-overview.md) to understand agents
2. Follow [Building Agents](./02-building-agents.md) to create your first agent
3. Explore [Workflow Patterns](./06-workflow-patterns.md) for your use case
4. Use [Loop Control](./04-loop-control.md) for advanced execution control

## Resources

- [AI SDK Official Docs](https://ai-sdk.dev/docs/agents)
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
