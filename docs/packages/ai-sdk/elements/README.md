# AI Elements Documentation

Complete documentation for AI Elements - a component library and custom registry built on top of shadcn/ui to help you build AI-native applications faster.

## Documentation Structure

### Getting Started

1. **[Overview](./01-OVERVIEW.md)** - Introduction to AI Elements and key features
2. **[Benefits](./02-BENEFITS.md)** - Why AI Elements is the best choice for AI chat interfaces
3. **[Setup Guide](./05-SETUP.md)** - Installation and configuration instructions
4. **[Usage Guide](./06-USAGE.md)** - How to use AI Elements components in your application

### Core Concepts

5. **[Philosophy](./10-PHILOSOPHY.md)** - Design principles guiding AI Elements
6. **[Vercel AI Frontend Stack](./11-VERCEL-AI-FRONTEND-STACK.md)** - How AI Gateway, AI SDK, and AI Elements work together

### Development

7. **[Troubleshooting](./07-TROUBLESHOOTING.md)** - Solutions to common issues
8. **[Skill Guide](./08-SKILL.md)** - Enhance your AI coding agent with AI Elements knowledge

### Contributing

9. **[How to Contribute](./04-HOW-TO-CONTRIBUTE.md)** - Guidelines for contributing to AI Elements
10. **[New Components](./09-NEW-COMPONENTS.md)** - Guidelines for proposing and building new components
11. **[Community](./03-COMMUNITY.md)** - Join the AI Elements community

### Reference

12. **[Components Index](./COMPONENTS-INDEX.md)** - Complete reference guide for all components

## Quick Navigation

### By Use Case

**Building a Chat Interface**
- Start with [Overview](./01-OVERVIEW.md)
- Follow [Setup Guide](./05-SETUP.md)
- Use [Usage Guide](./06-USAGE.md)
- Reference [Components Index](./COMPONENTS-INDEX.md)

**Understanding the Architecture**
- Read [Philosophy](./10-PHILOSOPHY.md)
- Learn about [Vercel AI Frontend Stack](./11-VERCEL-AI-FRONTEND-STACK.md)
- Check [Benefits](./02-BENEFITS.md)

**Troubleshooting Issues**
- Check [Troubleshooting](./07-TROUBLESHOOTING.md)
- Review [Setup Guide](./05-SETUP.md)
- Search [Components Index](./COMPONENTS-INDEX.md)

**Contributing to AI Elements**
- Read [How to Contribute](./04-HOW-TO-CONTRIBUTE.md)
- Review [New Components](./09-NEW-COMPONENTS.md)
- Join [Community](./03-COMMUNITY.md)

**Enhancing Your AI Agent**
- Install [Skill](./08-SKILL.md)
- Use with Cursor, Codeium, or other AI tools

## Key Concepts

### Composability
Components are building blocks that you combine to create exactly what you need. No rigid structures or forced layouts.

### Simplicity
Each component has a clear purpose and minimal API surface. You can always extend components in your codebase.

### Accessibility
Every component follows WCAG 2.1 AA accessibility standards with semantic HTML, ARIA attributes, and keyboard navigation.

### Performance
Components are optimized for real-world AI applications with minimal re-renders during streaming and efficient DOM updates.

### Developer Experience
Standard React patterns, TypeScript first, good defaults, and full control when needed.

### AI SDK Alignment
Deep integration with the AI SDK for seamless streaming, hooks, and status states.

### shadcn/ui Foundation
Components live in your codebase with CSS variables for theming and Tailwind CSS for styling.

### Open Source
Transparent development, community contributions welcome, no vendor lock-in, Apache 2.0 license.

## Component Categories

### Chatbot Components (18)
Attachments, Chain of Thought, Checkpoint, Confirmation, Context, Conversation, Inline Citation, Message, Model Selector, Plan, Prompt Input, Queue, Reasoning, Shimmer, Sources, Suggestion, Task, Tool

### Code Components (15)
Agent, Artifact, Code Block, Commit, Environment Variables, File Tree, JSX Preview, Package Info, Sandbox, Schema Display, Snippet, Stack Trace, Terminal, Test Results, Web Preview

### Voice Components (6)
Audio Player, Mic Selector, Persona, Speech Input, Transcription, Voice Selector

### Workflow Components (7)
Canvas, Connection, Controls, Edge, Node, Panel, Toolbar

### Utility Components (2)
Image, Open In Chat

**Total: 48 Components**

## Installation

### Quick Start
```bash
# Install a single component
npx ai-elements@latest add message

# Install multiple components
npx ai-elements@latest add message conversation prompt-input

# Install all components
npx ai-elements@latest add *
```

### Using shadcn CLI
```bash
npx shadcn@latest add @ai-elements/message
```

## Prerequisites

- Node.js 18 or later
- React 19
- Next.js 14+ (App Router recommended)
- AI SDK installed and configured
- shadcn/ui initialized in your project
- Tailwind CSS 4

## Getting Started

1. **Read the Overview** - Understand what AI Elements is
2. **Follow Setup Guide** - Install and configure
3. **Review Usage Guide** - Learn how to use components
4. **Check Components Index** - Find the components you need
5. **Build Your App** - Create your AI interface

## Common Tasks

### Create a Chat Interface
1. Install `message`, `conversation`, `prompt-input` components
2. Use `useChat` hook from AI SDK
3. Compose components together
4. Integrate with your API route

### Display Code
1. Install `code-block`, `terminal`, `file-tree` components
2. Use with code content from AI responses
3. Customize styling as needed

### Build a Workflow
1. Install `canvas`, `node`, `edge`, `connection` components
2. Define your workflow structure
3. Handle user interactions
4. Visualize the workflow

### Add Voice Support
1. Install `audio-player`, `speech-input`, `transcription` components
2. Handle microphone permissions
3. Process audio data
4. Display transcriptions

## Best Practices

1. **Use Composition** - Build complex UIs from smaller components
2. **Leverage TypeScript** - Use proper types for better DX
3. **Handle Streaming** - Use components designed for streaming
4. **Customize Carefully** - Modify components in your codebase
5. **Test Accessibility** - Ensure components work for all users
6. **Follow Conventions** - Match existing patterns

## Troubleshooting

Common issues and solutions:

- **Components not styled** - Check Tailwind CSS configuration
- **Import errors** - Verify tsconfig.json path aliases
- **Theme not switching** - Ensure data-theme attribute is set
- **CLI not working** - Verify you're in project root

See [Troubleshooting Guide](./07-TROUBLESHOOTING.md) for detailed solutions.

## Contributing

We welcome contributions! See [How to Contribute](./04-HOW-TO-CONTRIBUTE.md) for guidelines.

### Types of Contributions
- Bug reports and fixes
- Documentation improvements
- New components
- Performance enhancements
- Accessibility improvements

## Community

Join the AI Elements community:
- Report issues on GitHub
- Participate in discussions
- Share your work
- Help others

See [Community Guide](./03-COMMUNITY.md) for more information.

## Resources

- **Official Website** - [elements.ai-sdk.dev](https://elements.ai-sdk.dev)
- **GitHub Repository** - [vercel/ai-elements](https://github.com/vercel/ai-elements)
- **AI SDK Documentation** - [ai-sdk.dev](https://ai-sdk.dev)
- **shadcn/ui** - [ui.shadcn.com](https://ui.shadcn.com)
- **Tailwind CSS** - [tailwindcss.com](https://tailwindcss.com)

## License

AI Elements is open source under the Apache 2.0 license.

## Support

Need help?

1. Check the [Troubleshooting Guide](./07-TROUBLESHOOTING.md)
2. Review the [Usage Guide](./06-USAGE.md)
3. Search [GitHub Issues](https://github.com/vercel/ai-elements/issues)
4. Ask in [GitHub Discussions](https://github.com/vercel/ai-elements/discussions)
5. Open a new issue with details

## Next Steps

- **New to AI Elements?** Start with [Overview](./01-OVERVIEW.md)
- **Ready to build?** Follow [Setup Guide](./05-SETUP.md)
- **Need specific components?** Check [Components Index](./COMPONENTS-INDEX.md)
- **Want to contribute?** See [How to Contribute](./04-HOW-TO-CONTRIBUTE.md)

---

**Last Updated:** February 2026

**Documentation Version:** 1.0

**AI Elements Version:** Latest

For the most up-to-date information, visit [elements.ai-sdk.dev](https://elements.ai-sdk.dev)
