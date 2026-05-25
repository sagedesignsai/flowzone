# Chain of Thought Component

A collapsible component that visualizes AI reasoning steps with support for search results, images, and step-by-step progress indicators.

## Overview

The `ChainOfThought` component provides a visual representation of an AI's reasoning process, showing step-by-step thinking with support for search results, images, and progress indicators. It helps users understand how AI arrives at conclusions by displaying intermediate reasoning steps.

## Installation

```bash
npx ai-elements@latest add chain-of-thought
```

## Features

- **Collapsible interface**: Smooth animations powered by Radix UI
- **Step visualization**: Step-by-step representation of AI reasoning
- **Status indicators**: Support for complete, active, and pending states
- **Search results**: Built-in display for search results with badge styling
- **Image support**: Display images with captions for visual content
- **Custom icons**: Different icons for different step types
- **Context API**: Context-aware components using React Context
- **TypeScript**: Full type definitions
- **Accessibility**: Keyboard navigation support
- **Responsive**: Adapts to different screen sizes
- **Animations**: Smooth fade and slide transitions
- **Composable**: Flexible customization architecture

## Usage

Display AI reasoning process with step-by-step visualization:

```tsx
"use client";

import {
  ChainOfThought,
  ChainOfThoughtStep,
  ChainOfThoughtStepIcon,
  ChainOfThoughtStepTitle,
  ChainOfThoughtStepContent,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
  ChainOfThoughtImage,
} from "@/components/ai-elements/chain-of-thought";

export default function ReasoningExample() {
  return (
    <ChainOfThought>
      <ChainOfThoughtStep status="complete">
        <ChainOfThoughtStepIcon />
        <ChainOfThoughtStepTitle>Searching for profiles</ChainOfThoughtStepTitle>
        <ChainOfThoughtStepContent>
          <ChainOfThoughtSearchResults>
            <ChainOfThoughtSearchResult url="www.x.com" />
            <ChainOfThoughtSearchResult url="www.instagram.com" />
            <ChainOfThoughtSearchResult url="www.github.com" />
          </ChainOfThoughtSearchResults>
        </ChainOfThoughtStepContent>
      </ChainOfThoughtStep>

      <ChainOfThoughtStep status="complete">
        <ChainOfThoughtStepIcon />
        <ChainOfThoughtStepTitle>Found profile photo</ChainOfThoughtStepTitle>
        <ChainOfThoughtStepContent>
          <ChainOfThoughtImage
            src="/profile.jpg"
            alt="Profile photo"
            caption="Profile photo from x.com"
          />
        </ChainOfThoughtStepContent>
      </ChainOfThoughtStep>

      <ChainOfThoughtStep status="active">
        <ChainOfThoughtStepIcon />
        <ChainOfThoughtStepTitle>Analyzing information</ChainOfThoughtStepTitle>
      </ChainOfThoughtStep>

      <ChainOfThoughtStep status="pending">
        <ChainOfThoughtStepIcon />
        <ChainOfThoughtStepTitle>Generating response</ChainOfThoughtStepTitle>
      </ChainOfThoughtStep>
    </ChainOfThought>
  );
}
```

## Component Props

### ChainOfThought (Root)

Root container for the chain of thought visualization.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Step components |
| `className` | `string` | Additional CSS classes |

### ChainOfThoughtStep

Individual reasoning step.

| Prop | Type | Description |
|------|------|-------------|
| `status` | `"complete" \| "active" \| "pending"` | Step status |
| `children` | `React.ReactNode` | Step content |
| `className` | `string` | Additional CSS classes |

### ChainOfThoughtStepIcon

Icon indicator for the step status.

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `React.ReactNode` | Custom icon |
| `className` | `string` | Additional CSS classes |

### ChainOfThoughtStepTitle

Title of the reasoning step.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Title text |
| `className` | `string` | Additional CSS classes |

### ChainOfThoughtStepContent

Content container for step details.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Step details |
| `className` | `string` | Additional CSS classes |

### ChainOfThoughtSearchResults

Container for search results.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Search result items |
| `className` | `string` | Additional CSS classes |

### ChainOfThoughtSearchResult

Individual search result badge.

| Prop | Type | Description |
|------|------|-------------|
| `url` | `string` | Result URL |
| `title` | `string` | Result title |
| `className` | `string` | Additional CSS classes |

### ChainOfThoughtImage

Image display with caption.

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Image source URL |
| `alt` | `string` | Alt text |
| `caption` | `string` | Image caption |
| `className` | `string` | Additional CSS classes |

## Step Statuses

### Complete

Indicates a finished reasoning step. Shows checkmark icon and completed styling.

```tsx
<ChainOfThoughtStep status="complete">
  <ChainOfThoughtStepIcon />
  <ChainOfThoughtStepTitle>Step completed</ChainOfThoughtStepTitle>
</ChainOfThoughtStep>
```

### Active

Indicates the currently executing step. Shows animated indicator.

```tsx
<ChainOfThoughtStep status="active">
  <ChainOfThoughtStepIcon />
  <ChainOfThoughtStepTitle>Currently processing</ChainOfThoughtStepTitle>
</ChainOfThoughtStep>
```

### Pending

Indicates a step waiting to execute. Shows placeholder styling.

```tsx
<ChainOfThoughtStep status="pending">
  <ChainOfThoughtStepIcon />
  <ChainOfThoughtStepTitle>Waiting to start</ChainOfThoughtStepTitle>
</ChainOfThoughtStep>
```

## Examples

### Search and Analysis Flow

Display a complete search and analysis workflow:

```tsx
<ChainOfThought>
  <ChainOfThoughtStep status="complete">
    <ChainOfThoughtStepIcon />
    <ChainOfThoughtStepTitle>Searching for information</ChainOfThoughtStepTitle>
    <ChainOfThoughtStepContent>
      <ChainOfThoughtSearchResults>
        <ChainOfThoughtSearchResult url="source1.com" title="Source 1" />
        <ChainOfThoughtSearchResult url="source2.com" title="Source 2" />
      </ChainOfThoughtSearchResults>
    </ChainOfThoughtStepContent>
  </ChainOfThoughtStep>

  <ChainOfThoughtStep status="complete">
    <ChainOfThoughtStepIcon />
    <ChainOfThoughtStepTitle>Analyzing sources</ChainOfThoughtStepTitle>
  </ChainOfThoughtStep>

  <ChainOfThoughtStep status="active">
    <ChainOfThoughtStepIcon />
    <ChainOfThoughtStepTitle>Synthesizing response</ChainOfThoughtStepTitle>
  </ChainOfThoughtStep>
</ChainOfThought>
```

### Multi-Step Reasoning

Show complex reasoning with multiple steps:

```tsx
<ChainOfThought>
  {steps.map((step, index) => (
    <ChainOfThoughtStep key={index} status={step.status}>
      <ChainOfThoughtStepIcon icon={step.icon} />
      <ChainOfThoughtStepTitle>{step.title}</ChainOfThoughtStepTitle>
      {step.content && (
        <ChainOfThoughtStepContent>
          {step.content}
        </ChainOfThoughtStepContent>
      )}
    </ChainOfThoughtStep>
  ))}
</ChainOfThought>
```

## Styling

The component uses Tailwind CSS and respects your design system:

- Automatic dark mode support
- CSS variable integration
- Customizable through className prop
- Smooth animations and transitions
- Responsive layout

## Accessibility

- Semantic HTML structure
- ARIA labels for status indicators
- Keyboard navigation support
- Screen reader friendly
- Proper color contrast ratios

## Best Practices

1. **Clear titles**: Use descriptive titles for each step
2. **Logical order**: Arrange steps in logical reasoning order
3. **Status updates**: Update status as reasoning progresses
4. **Visual hierarchy**: Use icons to distinguish step types
5. **Content clarity**: Keep step content concise and focused
6. **Error handling**: Show error status for failed steps

## Performance Considerations

- Lazy load images in steps
- Memoize step components for large chains
- Use virtualization for very long reasoning chains
- Optimize animations for smooth performance

## Related Components

- [Message](/docs/components/message) - Display messages with reasoning
- [Reasoning](/docs/components/reasoning) - Alternative reasoning display
- [Conversation](/docs/components/conversation) - Chat interface container

---

**Last Updated:** February 2026
**Component Version:** Latest
