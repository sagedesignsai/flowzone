# Context Component

A compound component system for displaying AI model context window usage, token consumption, and cost estimation.

## Overview

The `Context` component provides a comprehensive view of AI model usage through a compound component system. It displays context window utilization, token consumption breakdown (input, output, reasoning, cache), and cost estimation in an interactive hover card interface.

## Installation

```bash
npx ai-elements@latest add context
```

## Features

- **Compound Component Architecture**: Flexible composition of context display elements
- **Visual Progress Indicator**: Circular SVG progress ring showing context usage percentage
- **Token Breakdown**: Detailed view of input, output, reasoning, and cached tokens
- **Cost Estimation**: Real-time cost calculation using the `tokenlens` library
- **Intelligent Formatting**: Automatic token count formatting (K, M, B suffixes)
- **Interactive Hover Card**: Detailed information revealed on hover
- **Context Provider Pattern**: Clean data flow through React Context API
- **TypeScript Support**: Full type definitions for all components
- **Accessible Design**: Proper ARIA labels and semantic HTML
- **Theme Integration**: Uses currentColor for automatic theme adaptation

## Usage

Display AI model context usage with token breakdown and cost:

```tsx
"use client";

import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextHeader,
  ContextBody,
  ContextFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from "@/components/ai-elements/context";

export default function ContextExample() {
  return (
    <Context
      contextWindow={128000}
      inputTokens={5000}
      outputTokens={2500}
      reasoningTokens={1000}
      cacheTokens={500}
      modelId="openai/gpt-4o"
    >
      <ContextTrigger />
      <ContextContent>
        <ContextHeader />
        <ContextBody>
          <ContextInputUsage>Input: 5,000 tokens</ContextInputUsage>
          <ContextOutputUsage>Output: 2,500 tokens</ContextOutputUsage>
          <ContextReasoningUsage>Reasoning: 1,000 tokens</ContextReasoningUsage>
          <ContextCacheUsage>Cache: 500 tokens</ContextCacheUsage>
        </ContextBody>
        <ContextFooter />
      </ContextContent>
    </Context>
  );
}
```

## Component Props

### Context (Root)

Root provider component that holds all context data.

| Prop | Type | Description |
|------|------|-------------|
| `contextWindow` | `number` | Total context window size |
| `inputTokens` | `number` | Input token count |
| `outputTokens` | `number` | Output token count |
| `reasoningTokens` | `number` | Reasoning token count |
| `cacheTokens` | `number` | Cached token count |
| `modelId` | `string` | Model identifier for cost calculation |
| `children` | `React.ReactNode` | Context sub-components |
| `className` | `string` | Additional CSS classes |

### ContextTrigger

Interactive trigger element (default: button with percentage).

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Additional CSS classes |

### ContextContent

Hover card content container.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Content sections |
| `className` | `string` | Additional CSS classes |

### ContextHeader

Header section with progress visualization.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Header content |
| `className` | `string` | Additional CSS classes |

### ContextBody

Body section for usage breakdowns.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Usage components |
| `className` | `string` | Additional CSS classes |

### ContextFooter

Footer section for total cost.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Footer content |
| `className` | `string` | Additional CSS classes |

### Usage Components

All usage components share the same props:

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Usage label/content |
| `className` | `string` | Additional CSS classes |

**Available Usage Components:**
- `ContextInputUsage` - Input token usage
- `ContextOutputUsage` - Output token usage
- `ContextReasoningUsage` - Reasoning token usage
- `ContextCacheUsage` - Cached token usage

## Component Architecture

The Context component uses a compound component pattern with React Context for data sharing:

1. **Context** - Root provider component that holds all context data
2. **ContextTrigger** - Interactive trigger element (default: button with percentage)
3. **ContextContent** - Hover card content container
4. **ContextHeader** - Header section with progress visualization
5. **ContextBody** - Body section for usage breakdowns
6. **ContextFooter** - Footer section for total cost
7. **Usage Components** - Individual token usage displays (Input, Output, Reasoning, Cache)

## Token Formatting

The component uses `Intl.NumberFormat` with compact notation for automatic formatting:

- **Under 1,000**: Shows exact count (e.g., "842")
- **1,000+**: Shows with K suffix (e.g., "32K")
- **1,000,000+**: Shows with M suffix (e.g., "1.5M")
- **1,000,000,000+**: Shows with B suffix (e.g., "2.1B")

## Cost Calculation

When a `modelId` is provided, the component automatically calculates costs using the `tokenlens` library:

- **Input tokens**: Cost based on model's input pricing
- **Output tokens**: Cost based on model's output pricing
- **Reasoning tokens**: Special pricing for reasoning-capable models
- **Cached tokens**: Reduced pricing for cached input tokens
- **Total cost**: Sum of all token type costs

Costs are formatted using `Intl.NumberFormat` with USD currency.

## Examples

### Basic Usage

Display context usage with default components:

```tsx
<Context
  contextWindow={128000}
  inputTokens={5000}
  outputTokens={2500}
  modelId="openai/gpt-4o"
>
  <ContextTrigger />
  <ContextContent>
    <ContextHeader />
    <ContextBody>
      <ContextInputUsage />
      <ContextOutputUsage />
    </ContextBody>
    <ContextFooter />
  </ContextContent>
</Context>
```

### With Reasoning Tokens

Display context with reasoning token breakdown:

```tsx
<Context
  contextWindow={128000}
  inputTokens={5000}
  outputTokens={2500}
  reasoningTokens={3000}
  modelId="openai/gpt-4o"
>
  <ContextTrigger />
  <ContextContent>
    <ContextHeader />
    <ContextBody>
      <ContextInputUsage>Input: 5,000</ContextInputUsage>
      <ContextOutputUsage>Output: 2,500</ContextOutputUsage>
      <ContextReasoningUsage>Reasoning: 3,000</ContextReasoningUsage>
    </ContextBody>
    <ContextFooter />
  </ContextContent>
</Context>
```

### With Cache Tokens

Display context with cached token information:

```tsx
<Context
  contextWindow={128000}
  inputTokens={5000}
  outputTokens={2500}
  cacheTokens={1000}
  modelId="openai/gpt-4o"
>
  <ContextTrigger />
  <ContextContent>
    <ContextHeader />
    <ContextBody>
      <ContextInputUsage>Input: 5,000</ContextInputUsage>
      <ContextOutputUsage>Output: 2,500</ContextOutputUsage>
      <ContextCacheUsage>Cache: 1,000</ContextCacheUsage>
    </ContextBody>
    <ContextFooter />
  </ContextContent>
</Context>
```

### Custom Styling

Customize context display with className:

```tsx
<Context
  contextWindow={128000}
  inputTokens={5000}
  outputTokens={2500}
  modelId="openai/gpt-4o"
  className="w-full"
>
  <ContextTrigger className="w-full" />
  <ContextContent className="w-80">
    <ContextHeader className="border-b pb-2" />
    <ContextBody className="space-y-2 py-2">
      <ContextInputUsage className="text-sm" />
      <ContextOutputUsage className="text-sm" />
    </ContextBody>
    <ContextFooter className="border-t pt-2" />
  </ContextContent>
</Context>
```

## Styling

The component uses Tailwind CSS and respects your design system:

- Progress indicator uses `currentColor` for theme adaptation
- Hover card has customizable width and padding
- Footer has a secondary background for visual separation
- All text sizes use the `text-xs` class for consistency
- Muted foreground colors for secondary information

## Accessibility

- Semantic HTML structure
- ARIA labels for progress indicator
- Keyboard navigation support
- Screen reader friendly
- Proper color contrast ratios
- Focus management

## Best Practices

1. **Always provide modelId**: For accurate cost calculation
2. **Update tokens regularly**: Reflect actual usage
3. **Show context percentage**: Help users understand usage
4. **Format numbers clearly**: Use automatic formatting
5. **Display costs**: Show financial impact
6. **Responsive design**: Adapt to different screen sizes

## Performance Considerations

- Memoize context values to prevent unnecessary re-renders
- Use virtualization for large token lists
- Lazy load cost calculations
- Optimize number formatting

## Related Components

- [Message](/docs/components/message) - Display messages
- [Conversation](/docs/components/conversation) - Chat interface
- [Prompt Input](/docs/components/prompt-input) - Input area

---

**Last Updated:** February 2026
**Component Version:** Latest
