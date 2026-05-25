# Checkpoint Component

A simple component for marking conversation history points and restoring the chat to a previous state.

## Overview

The `Checkpoint` component provides a way to mark specific points in a conversation history and restore the chat to that state. Inspired by VSCode's Copilot checkpoint feature, it allows users to revert to an earlier conversation state while maintaining a clear visual separation between different conversation segments.

## Installation

```bash
npx ai-elements@latest add checkpoint
```

## Features

- **Simple flex layout**: Icon, trigger, and separator
- **Visual separator**: Clear conversation breaks
- **Restore functionality**: Revert to checkpoint state
- **Customizable icon**: Defaults to BookmarkIcon
- **Keyboard accessible**: ARIA labels and navigation
- **Responsive design**: Adapts to different screen sizes
- **Theme integration**: Light/dark mode support

## Usage with AI SDK

Build a chat interface with conversation checkpoints:

```tsx
"use client";

import { useState, Fragment } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "@/components/ai-elements/checkpoint";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";

type CheckpointType = {
  id: string;
  messageIndex: number;
  timestamp: Date;
  messageCount: number;
};

const CheckpointDemo = () => {
  const { messages, setMessages } = useChat();
  const [checkpoints, setCheckpoints] = useState<CheckpointType[]>([]);

  const createCheckpoint = (messageIndex: number) => {
    const checkpoint: CheckpointType = {
      id: crypto.randomUUID(),
      messageIndex,
      timestamp: new Date(),
      messageCount: messageIndex + 1,
    };
    setCheckpoints([...checkpoints, checkpoint]);
  };

  const restoreToCheckpoint = (messageIndex: number) => {
    setMessages(messages.slice(0, messageIndex + 1));
    setCheckpoints(
      checkpoints.filter((cp) => cp.messageIndex <= messageIndex)
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <Conversation>
        <ConversationContent>
          {messages.map((message, index) => {
            const checkpoint = checkpoints.find(
              (cp) => cp.messageIndex === index
            );

            return (
              <Fragment key={message.id}>
                <Message from={message.role}>
                  <MessageContent>
                    <MessageResponse>{message.content}</MessageResponse>
                  </MessageContent>
                </Message>

                {checkpoint && (
                  <Checkpoint>
                    <CheckpointIcon />
                    <CheckpointTrigger
                      onClick={() =>
                        restoreToCheckpoint(checkpoint.messageIndex)
                      }
                    >
                      Restore checkpoint
                    </CheckpointTrigger>
                  </Checkpoint>
                )}
              </Fragment>
            );
          })}
        </ConversationContent>
      </Conversation>
    </div>
  );
};

export default CheckpointDemo;
```

## Component Props

### Checkpoint (Root)

Root container for checkpoint display.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Checkpoint sub-components |
| `className` | `string` | Additional CSS classes |

### CheckpointIcon

Icon indicator for the checkpoint.

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `React.ReactNode` | Custom icon (defaults to BookmarkIcon) |
| `className` | `string` | Additional CSS classes |

### CheckpointTrigger

Clickable trigger for restoring checkpoint.

| Prop | Type | Description |
|------|------|-------------|
| `onClick` | `() => void` | Restore callback |
| `children` | `React.ReactNode` | Trigger text |
| `className` | `string` | Additional CSS classes |

## Use Cases

### Manual Checkpoints

Allow users to manually create checkpoints at important conversation points:

```tsx
import { Button } from "@/components/ui/button";

<Button onClick={() => createCheckpoint(messages.length - 1)}>
  Create Checkpoint
</Button>
```

### Automatic Checkpoints

Create checkpoints automatically after significant conversation milestones:

```tsx
useEffect(() => {
  if (messages.length > 0 && messages.length % 5 === 0) {
    createCheckpoint(messages.length - 1);
  }
}, [messages.length]);
```

### Branching Conversations

Use checkpoints to enable conversation branching:

```tsx
const restoreAndBranch = (messageIndex: number) => {
  const currentBranch = messages.slice(messageIndex + 1);
  saveBranch(currentBranch);
  restoreToCheckpoint(messageIndex);
};
```

### Topic Transitions

Mark checkpoints when conversation topic changes:

```tsx
const handleTopicChange = () => {
  createCheckpoint(messages.length - 1);
  // Start new topic
};
```

## Styling

The component uses Tailwind CSS:

- Automatic dark mode support
- CSS variable integration
- Customizable through className prop
- Responsive layout
- Smooth transitions

## Accessibility

- Semantic HTML structure
- ARIA labels for buttons
- Keyboard navigation support
- Screen reader friendly
- Proper color contrast ratios

## Best Practices

1. **Clear labeling**: Use descriptive text for checkpoint triggers
2. **Visual feedback**: Provide feedback when checkpoint is restored
3. **Limit checkpoints**: Don't create too many checkpoints
4. **Timestamp tracking**: Store timestamps for reference
5. **User control**: Let users decide when to create checkpoints
6. **Cleanup**: Remove old checkpoints to save memory

## Advanced Usage

### Checkpoint Management

Implement checkpoint management UI:

```tsx
const [checkpoints, setCheckpoints] = useState<CheckpointType[]>([]);

const listCheckpoints = () => (
  <div className="space-y-2">
    {checkpoints.map((cp) => (
      <div key={cp.id} className="flex items-center justify-between">
        <span>{cp.timestamp.toLocaleTimeString()}</span>
        <button onClick={() => restoreToCheckpoint(cp.messageIndex)}>
          Restore
        </button>
      </div>
    ))}
  </div>
);
```

### Checkpoint Persistence

Save checkpoints to local storage:

```tsx
useEffect(() => {
  localStorage.setItem("checkpoints", JSON.stringify(checkpoints));
}, [checkpoints]);

useEffect(() => {
  const saved = localStorage.getItem("checkpoints");
  if (saved) {
    setCheckpoints(JSON.parse(saved));
  }
}, []);
```

### Checkpoint Metadata

Store additional metadata with checkpoints:

```tsx
type CheckpointType = {
  id: string;
  messageIndex: number;
  timestamp: Date;
  messageCount: number;
  topic?: string;
  summary?: string;
  tags?: string[];
};
```

## Performance Considerations

- Memoize checkpoint list to prevent unnecessary re-renders
- Use virtualization for large checkpoint lists
- Implement checkpoint cleanup for old entries
- Consider checkpoint size limits

## Related Components

- [Message](/docs/components/message) - Display messages
- [Conversation](/docs/components/conversation) - Chat interface
- [Prompt Input](/docs/components/prompt-input) - Input area

---

**Last Updated:** February 2026
**Component Version:** Latest
