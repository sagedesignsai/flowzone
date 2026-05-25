# Building Tools for LLM Agents - Lindy AI Interview

## Overview

Interview with Flo Crivello, CEO of Lindy AI, about building reliable AI agents and internal tooling for agent development.

## Key Insights

### Two-Part Approach to Building Agents

Flo emphasizes that AI agents need two critical components:

1. **The correct collection of tools** - Having the right capabilities available
2. **Knowing how to utilize them** - Understanding when and how to use each tool

The Lindy AI team focuses primarily on the second point, as integrations aren't the main risk. They're developing techniques to help agents self-improve and learn from experience how to use tools better over time.

## Main Use Cases

**Lindy AI** is a personal assistant designed to save users' time by handling daily tasks:
- Managing schedules
- Composing emails
- Sending contracts
- General administrative work

**Ideal users**: Senior managers in the technology space

## Reliability & User Confirmation

Lindy has made significant progress in reliability by implementing a confirmation system:
- When unsure about a task or before high-stakes actions, the agent asks for user confirmation
- Over time, confirmations become less necessary as:
  - The agent becomes smarter
  - The agent learns user preferences

## Agent Debugging & Monitoring Tools

### Internal Tooling

The Lindy AI team has developed comprehensive internal tools for agent management:

**Most Important Tool: The Tracer**
- Shows step-by-step what the agent did to fulfill a user query
- Similar to LangSmith but with superior functionality

**Additional Tools:**
- **Memory Management** - View and edit "lessons" the agent learns over time
- **Tool Configuration** - Review available tools and edit instructions for when/how to use each
- **Rule Management** - Edit global rules or action-level rules
- **Benchmarking** - Monitor performance metrics

### Debugging Approach

Agent debugging follows similar principles to regular software debugging:
1. Examine available logs
2. Reproduce the issue
3. Try different solutions until the bug is fixed

## Key Challenges

### Fine-tuning
- Requires large models (40B+ parameters)
- Needs large context windows (8k+)
- Very painful and resource-intensive process

### Cognitive Architecture
- Extremely challenging to design correctly
- Lindy AI chose not to outsource this, viewing it as core to their mission

### Deployment at Scale
- Once the right model is developed, deploying it for inference at scale becomes another significant challenge

## Key Takeaways

1. **Tool utilization matters more than tool availability** - Focus on how agents use tools, not just having them
2. **Self-improvement is crucial** - Agents should learn from experience to improve over time
3. **Reliability requires confirmation** - User confirmation for uncertain/high-stakes actions builds trust
4. **Internal tooling is essential** - Invest in tracing, monitoring, and debugging tools
5. **Cognitive architecture is foundational** - Getting the agent's reasoning structure right is critical

---

**Source:** [Building tools for LLM agents with Flo Crivello - CEO at Lindy AI](https://e2b.dev/blog/about-building-tools-for-llm-agent-with-flo-crivello-ceo-at-lindy-ai)
