# AI Elements - Overview

## What is AI Elements?

AI Elements is a component library and custom registry built on top of shadcn/ui to help you build AI-native applications faster. It provides pre-built components like conversations, messages, and more for creating AI-powered interfaces.

## Key Features

### Fully Composable
Every component is designed as a building block. Combine small, focused pieces to create exactly the chat UI you need. No rigid structures or forced layouts.

### More Than Just Styled Components
AI Elements integrates deeply with the AI SDK. Components understand streaming responses, handle loading states, and work seamlessly with hooks like `useChat` and `useCompletion`.

- **Streaming support** - Components like `MessageResponse` handle partial markdown gracefully
- **Status awareness** - UI adapts to pending, streaming, and complete states
- **Type safety** - Props align with AI SDK types like `UIMessage`

### Intuitive & Developer-Friendly
If you know React and TypeScript, you already know AI Elements. Components follow familiar patterns:
- Standard React props with TypeScript types
- Sensible defaults that work out of the box
- Full control when you need it

### Accessible & Themeable
Built on shadcn/ui, AI Elements inherits:
- **WCAG 2.1 AA** accessibility baseline
- **CSS variables** for easy theming
- **Dark mode** support built-in
- **Semantic HTML** throughout

Your existing shadcn/ui theme applies automatically.

### Fast, Flexible Installation
Install only what you need. The CLI adds components directly to your codebase:
```bash
npx ai-elements@latest add message
```

- No hidden dependencies
- Full source code access
- Modify components freely
- Tree-shaking friendly

## Prerequisites

Before installing AI Elements, ensure your environment meets these requirements:

- **Node.js** 18 or later
- **React** 19
- **Next.js** 14+ (App Router recommended)
- **AI SDK** installed and configured
- **shadcn/ui** initialized in your project
- **Tailwind CSS** 4

## Quick Start Examples

### Chatbot
A full-featured chat interface with streaming, markdown and file attachments.

### IDE
IDE-style interface with syntax highlighting, terminal output and file trees.

### Workflow
Visualize and interact with your AI workflows.

## Component Categories

### Chatbot Components
- Attachments
- Chain of Thought
- Checkpoint
- Confirmation
- Context
- Conversation
- Inline Citation
- Message
- Model Selector
- Plan
- Prompt Input
- Queue
- Reasoning
- Shimmer
- Sources
- Suggestion
- Task
- Tool

### Code Components
- Agent
- Artifact
- Code Block
- Commit
- Environment Variables
- File Tree
- JSX Preview
- Package Info
- Sandbox
- Schema Display
- Snippet
- Stack Trace
- Terminal
- Test Results
- Web Preview

### Voice Components
- Audio Player
- Mic Selector
- Persona
- Speech Input
- Transcription
- Voice Selector

### Workflow Components
- Canvas
- Connection
- Controls
- Edge
- Node
- Panel
- Toolbar

### Utility Components
- Image
- Open In Chat

## Getting Started

1. Install components using the CLI
2. Import and use them in your application
3. Customize as needed for your use case
4. Integrate with AI SDK hooks for streaming and state management

## Next Steps

- [Setup Guide](/docs/setup) - Get AI Elements installed
- [Usage Guide](/docs/usage) - Learn how to use components
- [Component Library](/components) - Browse all available components
- [Examples](/examples) - See real-world implementations
