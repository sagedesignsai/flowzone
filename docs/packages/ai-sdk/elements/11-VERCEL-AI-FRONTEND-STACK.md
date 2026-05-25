# AI Elements - The Vercel AI Frontend Stack

## How AI Gateway, AI SDK, and AI Elements Work Together

Vercel provides a complete stack for building AI-powered applications. Here's how the pieces fit together.

## The Stack Overview

The Vercel AI Frontend Stack consists of three layers:

```
┌─────────────────────────────────────────┐
│         AI Elements (UI Layer)          │
│  Components, theming, accessibility     │
├─────────────────────────────────────────┤
│         AI SDK (Logic Layer)            │
│  Streaming, hooks, server integration   │
├─────────────────────────────────────────┤
│      AI Gateway (Access Layer)          │
│  Model access, caching, observability   │
└─────────────────────────────────────────┘
```

## AI Gateway

AI Gateway is your single point of access to AI models.

### What It Does

- **Unified API** - One API key for OpenAI, Anthropic, Google, and more
- **Caching** - Reduce costs by caching identical requests
- **Rate limiting** - Protect your application from abuse
- **Observability** - Monitor usage, latency, and costs
- **Fallbacks** - Automatically retry with backup models

### Benefits

- **Cost savings** - Caching reduces API calls
- **Reliability** - Automatic fallbacks to backup models
- **Visibility** - Monitor usage and costs
- **Flexibility** - Switch models without code changes
- **Security** - Single point for API key management

### Setup

Add `AI_GATEWAY_API_KEY` to your environment:

```bash
# .env.local
AI_GATEWAY_API_KEY=your_api_key_here
```

Then use it with the AI SDK by specifying a model string:

```typescript
const model = "anthropic/claude-sonnet-4.5"
```

### Model Strings

AI Gateway uses model strings to specify providers and models:

```
{provider}/{model}
```

Examples:
- `openai/gpt-4o` - OpenAI's GPT-4o
- `anthropic/claude-sonnet-4.5` - Anthropic's Claude
- `google/gemini-2.0-flash` - Google's Gemini
- `xai/grok-2` - xAI's Grok

### Caching

AI Gateway automatically caches identical requests:

```typescript
const result = streamText({
  model: "anthropic/claude-sonnet-4.5",
  system: "You are a helpful assistant.",
  messages: messages,
  // Caching is automatic
})
```

Cached responses are returned instantly, reducing costs and latency.

## AI SDK

The AI SDK provides the foundation for AI interactions.

### Core Features

- **Streaming** - Stream responses from any model
- **Tool calling** - Let models call functions
- **Structured output** - Get typed responses
- **Multi-modal** - Handle text, images, and files

### React Hooks

The AI SDK provides React hooks for client-side interactions:

```tsx
"use client"

import { useChat } from "@ai-sdk/react"
import { useState } from "react"

function Chat() {
  const [text, setText] = useState("")
  const { messages, sendMessage, status } = useChat({
    api: "/api/chat",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage({ text: text })
    setText("")
  }

  return (
    <form onSubmit={handleSubmit}>
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  )
}
```

### Server Integration

The AI SDK provides server-side functions for handling AI requests:

```typescript
// app/api/chat/route.ts
import { streamText } from "ai"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: "You are a helpful assistant.",
    messages: messages,
  })

  return result.toUIMessageStreamResponse()
}
```

### Streaming

The AI SDK handles streaming responses efficiently:

```typescript
const result = streamText({
  model: "anthropic/claude-sonnet-4.5",
  messages: messages,
})

// Stream to client
return result.toUIMessageStreamResponse()
```

Streaming allows responses to appear in real-time as they're generated.

## AI Elements

AI Elements provides the UI layer on top of the AI SDK.

### What It Adds

- **Pre-built components** - Message, Conversation, PromptInput, and more
- **Streaming support** - Components handle partial content gracefully
- **Composable design** - Build exactly the UI you need
- **Theme integration** - Works with your existing shadcn/ui setup

### Component Categories

**Chatbot Components**
- Message, Conversation, PromptInput
- Reasoning, Sources, Suggestions
- And many more...

**Code Components**
- CodeBlock, Terminal, FileTree
- Artifact, StackTrace, and more...

**Voice Components**
- AudioPlayer, SpeechInput, Transcription
- And more...

**Workflow Components**
- Canvas, Node, Edge, Connection
- And more...

### Integration Example

```tsx
"use client"

import { useChat } from "@ai-sdk/react"
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    api: "/api/chat",
  })

  const handleSubmit = (message: { text: string }) => {
    sendMessage({ text: message.text })
  }

  return (
    <div className="h-screen flex flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="p-4">
        <PromptInputTextarea placeholder="Type a message..." />
        <PromptInputSubmit status={status} />
      </PromptInput>
    </div>
  )
}
```

## Putting It Together

The full flow:

### 1. User Interaction
User types in an AI Elements `PromptInput` component.

### 2. Send Message
React hook (`useChat`) sends the message to your API route.

### 3. Process Request
Your API route receives the message and calls the AI SDK.

### 4. Stream Response
AI SDK streams the response from the model via AI Gateway.

### 5. Render Response
AI Elements renders the streaming response in `MessageResponse`.

### 6. Display to User
User sees the response appear in real-time.

## Data Flow Diagram

```
User Input
    ↓
PromptInput (AI Elements)
    ↓
useChat Hook (AI SDK)
    ↓
API Route (/api/chat)
    ↓
streamText (AI SDK)
    ↓
AI Gateway
    ↓
Model (OpenAI, Anthropic, etc.)
    ↓
Response Stream
    ↓
API Route
    ↓
useChat Hook
    ↓
Message Component (AI Elements)
    ↓
User Sees Response
```

## Layer Responsibilities

| Layer | Responsibility |
|-------|-----------------|
| **AI Gateway** | Model access, caching, observability |
| **AI SDK** | Streaming, hooks, server integration |
| **AI Elements** | UI components, theming, accessibility |

## Flexibility

This separation means you can swap any layer independently:

- **Use a different model provider** - Change AI Gateway configuration
- **Build custom hooks** - Extend or replace AI SDK hooks
- **Create custom components** - Build on top of AI Elements or use your own

## Example: Switching Models

To switch from Claude to GPT-4o:

```typescript
// Before
const model = "anthropic/claude-sonnet-4.5"

// After
const model = "openai/gpt-4o"
```

No component changes needed!

## Example: Custom Hook

You can create custom hooks on top of AI SDK:

```typescript
function useCustomChat(options) {
  const { messages, sendMessage, status } = useChat(options)
  
  // Add custom logic
  const handleCustomSubmit = (message) => {
    // Custom processing
    sendMessage(message)
  }
  
  return { messages, handleCustomSubmit, status }
}
```

## Example: Custom Components

You can create custom components on top of AI Elements:

```tsx
function CustomMessage({ message }) {
  return (
    <Message from={message.role}>
      <MessageContent>
        <MessageResponse>{message.content}</MessageResponse>
        <CustomActions message={message} />
      </MessageContent>
    </Message>
  )
}
```

## Best Practices

### 1. Use AI Gateway
Always use AI Gateway for model access:
- Unified API
- Cost savings through caching
- Better observability

### 2. Leverage Streaming
Use streaming for better UX:
- Responses appear in real-time
- Better perceived performance
- More engaging experience

### 3. Compose Components
Build UIs from composable components:
- More flexible
- Easier to customize
- Better code organization

### 4. Type Safety
Use TypeScript for type safety:
- Catch errors early
- Better developer experience
- Self-documenting code

### 5. Error Handling
Handle errors gracefully:
- Catch API errors
- Show user-friendly messages
- Log errors for debugging

## Getting Started

1. **Set up AI Gateway** - Get an API key
2. **Install AI SDK** - Add to your project
3. **Install AI Elements** - Add components
4. **Create API route** - Handle AI requests
5. **Build UI** - Use AI Elements components
6. **Test** - Verify everything works

## Next Steps

- [AI Gateway Documentation](https://vercel.com/docs/ai-gateway)
- [AI SDK Documentation](https://ai-sdk.dev)
- [AI Elements Documentation](/docs)
- [Examples](/examples)

## Summary

The Vercel AI Frontend Stack provides:

- **AI Gateway** - Unified access to AI models
- **AI SDK** - Streaming and hooks for AI interactions
- **AI Elements** - Pre-built components for AI UIs

Together, they provide a complete solution for building AI-powered applications with a great user experience.
