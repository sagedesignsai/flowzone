# Conversation Component

Wraps messages and automatically scrolls to the bottom. Also includes a scroll button that appears when not at the bottom.

## Overview

The `Conversation` component wraps messages and automatically scrolls to the bottom as new messages arrive. It includes a scroll button that appears when the user scrolls up, allowing them to quickly return to the latest messages. Perfect for building chat interfaces.

## Installation

```bash
npx ai-elements@latest add conversation
```

## Features

- **Automatic scrolling**: Scrolls to bottom when new messages are added
- **Smooth scrolling**: Configurable animation behavior
- **Scroll button**: Appears when not at bottom
- **Download functionality**: Export conversation as Markdown
- **Responsive design**: Customizable padding and spacing
- **Flexible layout**: Consistent message spacing
- **Accessibility**: Proper ARIA roles for screen readers
- **Customizable styling**: Through className prop
- **Multiple children**: Support for any number of message components

## Usage with AI SDK

Build a simple conversational UI with `Conversation` and `PromptInput`:

```tsx
"use client";

import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";

const ConversationDemo = () => {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="size-12" />}
                title="Start a conversation"
                description="Type a message below to begin chatting"
              />
            ) : (
              messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      }
                      return null;
                    })}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>

          <ConversationDownload messages={messages} />
          <ConversationScrollButton />
        </Conversation>

        <Input
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={status === "streaming" ? "streaming" : "ready"}
            disabled={!input.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
};

export default ConversationDemo;
```

## Backend Setup

Add the following route to your backend:

```tsx
import { streamText, UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-4o",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

## Component Props

### Conversation (Root)

Root container for the conversation.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Conversation sub-components |
| `className` | `string` | Additional CSS classes |

### ConversationContent

Content container for messages.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Message components |
| `className` | `string` | Additional CSS classes |

### ConversationEmptyState

Empty state display when no messages.

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `React.ReactNode` | Icon to display |
| `title` | `string` | Empty state title |
| `description` | `string` | Empty state description |
| `className` | `string` | Additional CSS classes |

### ConversationDownload

Button to download conversation as Markdown.

| Prop | Type | Description |
|------|------|-------------|
| `messages` | `UIMessage[]` | Messages to download |
| `filename` | `string` | Download filename |
| `className` | `string` | Additional CSS classes |

### ConversationScrollButton

Button that appears when scrolled up.

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Additional CSS classes |

## Utility Functions

### messagesToMarkdown

Convert messages to Markdown format.

```tsx
import { messagesToMarkdown } from "@/components/ai-elements/conversation";

const markdown = messagesToMarkdown(messages);

// With custom formatter
const customMarkdown = messagesToMarkdown(
  messages,
  (msg, i) => `[${msg.role}]: ${msg.content}`
);
```

## Examples

### Basic Chat Interface

Simple chat with messages and input:

```tsx
<Conversation>
  <ConversationContent>
    {messages.map((msg) => (
      <Message key={msg.id} from={msg.role}>
        <MessageContent>
          <MessageResponse>{msg.content}</MessageResponse>
        </MessageContent>
      </Message>
    ))}
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>
```

### With Download Feature

Add conversation download:

```tsx
<Conversation>
  <ConversationContent>
    {/* messages */}
  </ConversationContent>
  <ConversationDownload messages={messages} filename="chat.md" />
  <ConversationScrollButton />
</Conversation>
```

### With Empty State

Show empty state when no messages:

```tsx
<Conversation>
  <ConversationContent>
    {messages.length === 0 ? (
      <ConversationEmptyState
        icon={<ChatIcon />}
        title="No messages yet"
        description="Start typing to begin"
      />
    ) : (
      messages.map((msg) => <Message key={msg.id} from={msg.role} />)
    )}
  </ConversationContent>
</Conversation>
```

## Styling

The component uses Tailwind CSS:

- Automatic dark mode support
- CSS variable integration
- Customizable through className prop
- Responsive layout
- Smooth scrolling animations

## Accessibility

- Semantic HTML structure
- ARIA roles for screen readers
- Keyboard navigation support
- Screen reader friendly
- Proper color contrast ratios
- Focus management

## Best Practices

1. **Always provide keys**: Use unique message IDs for proper rendering
2. **Handle empty state**: Show helpful message when no conversations
3. **Optimize scrolling**: Use virtualization for very long conversations
4. **Responsive design**: Test on mobile devices
5. **Loading states**: Show indicators while messages stream
6. **Error handling**: Display errors gracefully

## Performance Considerations

- Memoize message components to prevent unnecessary re-renders
- Use virtualization for conversations with 100+ messages
- Lazy load older messages for long conversations
- Optimize scroll event handlers
- Consider message pagination

## Related Components

- [Message](/docs/components/message) - Individual message display
- [Prompt Input](/docs/components/prompt-input) - Input area
- [Conversation Download](/docs/components/conversation) - Export functionality

---

**Last Updated:** February 2026
**Component Version:** Latest
