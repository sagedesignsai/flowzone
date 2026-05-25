# AI Elements - New Components Guide

## Guidelines for Proposing and Building New AI Elements Components

Want to add a new component to AI Elements? This guide covers what we look for and how to submit.

## Fit & Scope

Before building, consider whether the component:

### Solves an AI-Specific Need

Components should address challenges unique to AI interfaces:

- Chat and conversation UIs
- Streaming content display
- Model status and feedback
- AI-specific interactions (regenerate, branch, etc.)

### Doesn't Already Exist

Check if shadcn/ui or another library already provides what you need. AI Elements focuses on components that require AI-specific behavior.

### Has Broad Applicability

The component should be useful across different AI applications, not just your specific use case.

## Design Requirements

### Composability

Build components from smaller pieces:

```tsx
// Good: Composable
<Message from="assistant">
  <MessageContent>
    <MessageResponse>{text}</MessageResponse>
  </MessageContent>
</Message>

// Avoid: Monolithic
<Message from="assistant" content={text} />
```

Benefits:
- Flexibility - Add, remove, or rearrange pieces
- Control - Style and configure each part independently
- Clarity - Understand exactly what renders

### Consistency

Follow existing patterns in the library:

- Use `cn()` for class merging
- Extend HTML primitive attributes
- Use CSS variables for theming
- Match naming conventions

### Accessibility

Components must be:

- Keyboard navigable
- Screen reader friendly
- WCAG 2.1 AA compliant
- Properly labeled

## Documentation Requirements

Every component needs:

1. **MDX documentation** with title and description
2. **Props table** documenting all props
3. **Usage examples** showing AI SDK integration
4. **Installation instructions**

### Example Documentation Structure

```mdx
# Component Name

Brief description of what the component does.

## Usage

```tsx
import { Component } from "@/components/ai-elements/component"

export default function Example() {
  return <Component />
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| prop1 | string | Description |
| prop2 | boolean | Description |

## Examples

### Basic Usage
...

### With AI SDK
...
```

## Technical Standards

### TypeScript

- Export all prop types
- Use proper generics where needed
- Avoid `any` types
- Use strict mode

Example:

```tsx
interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary"
  size?: "sm" | "md" | "lg"
}

export const Component = React.forwardRef<
  HTMLDivElement,
  ComponentProps
>(({ variant = "default", size = "md", ...props }, ref) => (
  <div ref={ref} {...props}>
    {/* content */}
  </div>
))

Component.displayName = "Component"
```

### Testing

- Add unit tests for component logic
- Test accessibility with automated tools
- Verify behavior with AI SDK hooks

### Code Style

- Follow the project's Biome configuration
- Run `pnpm run check` before submitting
- Match existing component patterns

## Submission Process

### 1. Open an Issue First

Describe the component and its use case. Get feedback before building.

Include:
- Component name and purpose
- Use cases and examples
- Why it's needed in AI Elements
- How it differs from existing solutions

### 2. Build the Component

Follow the patterns in `packages/elements/src/`:

```
packages/elements/src/
├── components/
│   ├── message/
│   │   ├── message.tsx
│   │   ├── message-content.tsx
│   │   └── index.ts
│   └── new-component/
│       ├── new-component.tsx
│       ├── new-component-part.tsx
│       └── index.ts
```

### 3. Add Examples

Create examples in `packages/examples/src/`:

```
packages/examples/src/
├── components/
│   └── new-component-example.tsx
```

### 4. Write Documentation

Add MDX docs in `apps/docs/content/components/`:

```
apps/docs/content/components/
└── new-component.mdx
```

### 5. Submit a Pull Request

Reference the original issue. Include:
- Screenshots or videos of the component in action
- Description of changes
- Testing performed
- Any breaking changes

## Review Process

Maintainers will review for:

- **Alignment with library goals** - Does it fit AI Elements?
- **Code quality and patterns** - Does it follow conventions?
- **Documentation completeness** - Is it well documented?
- **Accessibility compliance** - Is it accessible?
- **AI SDK integration** - Does it work with AI SDK?

Expect feedback and iteration. Quality components take time to get right.

## Component Checklist

Before submitting, verify:

- [ ] Component solves an AI-specific need
- [ ] Component doesn't duplicate existing functionality
- [ ] Component is composable
- [ ] Component follows naming conventions
- [ ] Component is accessible (WCAG 2.1 AA)
- [ ] Component has TypeScript types
- [ ] Component has unit tests
- [ ] Component has documentation
- [ ] Component has usage examples
- [ ] Code passes linting (`pnpm run check`)
- [ ] All tests pass (`pnpm test`)

## Example Component Structure

Here's a minimal example of a new component:

```tsx
// new-component.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface NewComponentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary"
}

const NewComponent = React.forwardRef<
  HTMLDivElement,
  NewComponentProps
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border",
      variant === "default" && "bg-background text-foreground",
      variant === "secondary" && "bg-secondary text-secondary-foreground",
      className
    )}
    {...props}
  />
))

NewComponent.displayName = "NewComponent"

export { NewComponent, type NewComponentProps }
```

## Getting Help

If you need help:

1. Check existing components for patterns
2. Review the documentation
3. Ask in GitHub discussions
4. Comment on related issues

## Recognition

Contributors are recognized in:
- Release notes for significant contributions
- GitHub contributors page
- Project documentation

Your work helps developers worldwide build better AI applications.

## Next Steps

1. Open an issue describing your component idea
2. Get feedback from maintainers
3. Build the component following guidelines
4. Submit a pull request
5. Iterate based on feedback
6. Celebrate your contribution!
