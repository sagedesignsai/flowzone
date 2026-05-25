# AI Elements - Components Index

Complete reference guide for all AI Elements components organized by category.

## Chatbot Components

### Attachments
A flexible, composable attachment component for displaying files, images, videos, audio, and source documents.

**Features:**
- Three display variants: grid (thumbnails), inline (badges), and list (rows)
- Supports both FileUIPart and SourceDocumentUIPart from the AI SDK
- Automatic media type detection (image, video, audio, document, source)
- Hover card support for inline previews
- Remove button with customizable callback
- Composable architecture for maximum flexibility
- Accessible with proper ARIA labels
- TypeScript support with exported utility functions

**Installation:**
```bash
npx ai-elements@latest add attachments
```

**Key Components:**
- `<Attachments />` - Container component that sets the layout variant
- `<Attachment />` - Individual attachment item wrapper
- `<AttachmentPreview />` - Displays the media preview
- `<AttachmentInfo />` - Displays the filename and optional media type
- `<AttachmentRemove />` - Remove button that appears on hover
- `<AttachmentHoverCard />` - Wrapper for hover preview functionality

**Utility Functions:**
- `getMediaCategory(data)` - Returns the media category for an attachment
- `getAttachmentLabel(data)` - Returns the display label for an attachment

---

### Chain of Thought
A collapsible component that visualizes AI reasoning steps with support for search results, images, and step-by-step progress indicators.

**Features:**
- Collapsible interface with smooth animations powered by Radix UI
- Step-by-step visualization of AI reasoning process
- Support for different step statuses (complete, active, pending)
- Built-in search results display with badge styling
- Image support with captions for visual content
- Custom icons for different step types
- Context-aware components using React Context API
- Fully typed with TypeScript
- Accessible with keyboard navigation support
- Responsive design that adapts to different screen sizes
- Smooth fade and slide animations for content transitions
- Composable architecture for flexible customization

**Installation:**
```bash
npx ai-elements@latest add chain-of-thought
```

**Key Components:**
- `<ChainOfThought />` - Main container component
- `<ChainOfThoughtHeader />` - Header with collapsible trigger
- `<ChainOfThoughtStep />` - Individual reasoning step
- `<ChainOfThoughtSearchResults />` - Container for search results
- `<ChainOfThoughtSearchResult />` - Individual search result badge
- `<ChainOfThoughtContent />` - Collapsible content area
- `<ChainOfThoughtImage />` - Image display with caption support

---

### Checkpoint
A simple component for marking conversation history points and restoring the chat to a previous state.

**Features:**
- Simple flex layout with icon, trigger, and separator
- Visual separator line for clear conversation breaks
- Clickable restore button for reverting to checkpoint
- Customizable icon (defaults to BookmarkIcon)
- Keyboard accessible with proper ARIA labels
- Responsive design that adapts to different screen sizes
- Seamless light/dark theme integration

**Installation:**
```bash
npx ai-elements@latest add checkpoint
```

**Key Components:**
- `<Checkpoint />` - Main checkpoint container
- `<CheckpointIcon />` - Icon display component
- `<CheckpointTrigger />` - Clickable restore button

**Use Cases:**
- Manual checkpoints - Allow users to manually create checkpoints
- Automatic checkpoints - Create checkpoints after milestones
- Branching conversations - Enable conversation branching

---

### Confirmation
An alert-based component for managing tool execution approval workflows with request, accept, and reject states.

**Features:**
- Context-based state management for approval workflow
- Conditional rendering based on approval state
- Support for approval-requested, approval-responded, output-denied, and output-available states
- Built on shadcn/ui Alert and Button components
- TypeScript support with comprehensive type definitions
- Customizable styling with Tailwind CSS
- Keyboard navigation and accessibility support
- Theme-aware with automatic dark mode support

**Installation:**
```bash
npx ai-elements@latest add confirmation
```

**Key Components:**
- `<Confirmation />` - Main confirmation container
- `<ConfirmationRequest />` - Approval request display
- `<ConfirmationAccepted />` - Accepted status display
- `<ConfirmationRejected />` - Rejected status display
- `<ConfirmationActions />` - Action buttons container
- `<ConfirmationAction />` - Individual action button

**States:**
- Approval Request State - Shows approval request with action buttons
- Approved State - Shows accepted status
- Rejected State - Shows rejected status

---

## Code Components

### Code Block
Display syntax-highlighted code with line numbers, copy button, and language detection.

**Features:**
- Syntax highlighting with Shiki
- Line number display
- Copy to clipboard functionality
- Language detection and specification
- Theme support (light/dark)
- Responsive design
- Keyboard accessible

**Installation:**
```bash
npx ai-elements@latest add code-block
```

---

### Terminal
Display terminal output with ANSI color support and streaming capabilities.

**Features:**
- ANSI color support
- Streaming output display
- Scrollable content area
- Monospace font rendering
- Dark theme optimized
- Copy output functionality

**Installation:**
```bash
npx ai-elements@latest add terminal
```

---

### File Tree
Display hierarchical file structure with expand/collapse functionality.

**Features:**
- Expandable/collapsible folders
- File and folder icons
- Selection support
- Keyboard navigation
- Responsive design
- Customizable icons

**Installation:**
```bash
npx ai-elements@latest add file-tree
```

---

## Voice Components

### Audio Player
Display and control audio playback with standard controls.

**Features:**
- Play/pause controls
- Progress bar
- Volume control
- Time display
- Responsive design
- Keyboard accessible

**Installation:**
```bash
npx ai-elements@latest add audio-player
```

---

### Speech Input
Capture audio input from user microphone with visual feedback.

**Features:**
- Microphone access
- Recording indicator
- Waveform visualization
- Stop/start controls
- Error handling
- Accessibility support

**Installation:**
```bash
npx ai-elements@latest add speech-input
```

---

### Transcription
Display transcribed text from audio with speaker identification.

**Features:**
- Speaker labels
- Timestamp support
- Editable text
- Copy functionality
- Responsive layout
- Theme support

**Installation:**
```bash
npx ai-elements@latest add transcription
```

---

## Workflow Components

### Canvas
Interactive canvas for visualizing and editing workflows.

**Features:**
- Node-based workflow visualization
- Drag and drop support
- Connection drawing
- Zoom and pan
- Responsive design
- Customizable styling

**Installation:**
```bash
npx ai-elements@latest add canvas
```

---

### Node
Individual node component for workflow canvas.

**Features:**
- Customizable content
- Connection handles
- Drag support
- Selection state
- Responsive sizing
- Theme support

**Installation:**
```bash
npx ai-elements@latest add node
```

---

### Edge
Connection line between workflow nodes.

**Features:**
- Animated connections
- Bezier curves
- Customizable styling
- Hover effects
- Selection state
- Theme support

**Installation:**
```bash
npx ai-elements@latest add edge
```

---

## Utility Components

### Image
Display images with lazy loading and error handling.

**Features:**
- Lazy loading
- Error fallback
- Responsive sizing
- Alt text support
- Theme support
- Accessibility

**Installation:**
```bash
npx ai-elements@latest add image
```

---

### Open In Chat
Button component to open content in chat interface.

**Features:**
- Customizable text
- Icon support
- Click handler
- Responsive design
- Theme support
- Accessibility

**Installation:**
```bash
npx ai-elements@latest add open-in-chat
```

---

## Installation Guide

### Install All Components
```bash
npx ai-elements@latest add *
```

### Install Specific Category
```bash
# Chatbot components
npx ai-elements@latest add attachments chain-of-thought checkpoint confirmation

# Code components
npx ai-elements@latest add code-block terminal file-tree

# Voice components
npx ai-elements@latest add audio-player speech-input transcription

# Workflow components
npx ai-elements@latest add canvas node edge

# Utility components
npx ai-elements@latest add image open-in-chat
```

### Install Individual Component
```bash
npx ai-elements@latest add message
```

---

## Component Categories Summary

| Category | Components | Use Case |
|----------|-----------|----------|
| **Chatbot** | Attachments, Chain of Thought, Checkpoint, Confirmation, Context, Conversation, Inline Citation, Message, Model Selector, Plan, Prompt Input, Queue, Reasoning, Shimmer, Sources, Suggestion, Task, Tool | Chat interfaces and conversations |
| **Code** | Agent, Artifact, Code Block, Commit, Environment Variables, File Tree, JSX Preview, Package Info, Sandbox, Schema Display, Snippet, Stack Trace, Terminal, Test Results, Web Preview | Code display and execution |
| **Voice** | Audio Player, Mic Selector, Persona, Speech Input, Transcription, Voice Selector | Voice and audio interactions |
| **Workflow** | Canvas, Connection, Controls, Edge, Node, Panel, Toolbar | Workflow visualization |
| **Utilities** | Image, Open In Chat | General utilities |

---

## Common Patterns

### Using with AI SDK

```tsx
import { useChat } from "@ai-sdk/react"
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message"

export default function Chat() {
  const { messages } = useChat()
  
  return (
    <>
      {messages.map((msg) => (
        <Message key={msg.id} from={msg.role}>
          <MessageContent>
            <MessageResponse>{msg.content}</MessageResponse>
          </MessageContent>
        </Message>
      ))}
    </>
  )
}
```

### Composing Components

```tsx
<Message from="assistant">
  <MessageContent>
    <MessageResponse>{text}</MessageResponse>
  </MessageContent>
  <MessageActions>
    <MessageAction label="Copy" onClick={handleCopy}>
      <CopyIcon />
    </MessageAction>
  </MessageActions>
</Message>
```

### Customizing Styles

```tsx
<Message className="custom-class">
  <MessageContent className="custom-content">
    <MessageResponse>{text}</MessageResponse>
  </MessageContent>
</Message>
```

---

## Best Practices

1. **Use Composition** - Build complex UIs from smaller components
2. **Leverage TypeScript** - Use proper types for better DX
3. **Handle Streaming** - Use components designed for streaming content
4. **Customize Carefully** - Modify components in your codebase as needed
5. **Test Accessibility** - Ensure components work for all users
6. **Follow Conventions** - Match existing patterns in the library

---

## Getting Help

- **Documentation** - Full docs at [elements.ai-sdk.dev](https://elements.ai-sdk.dev)
- **Examples** - See real-world implementations at [/examples](/examples)
- **GitHub Issues** - Report bugs or request features
- **Community** - Join discussions and ask questions

---

## Next Steps

1. Choose components for your use case
2. Install using the CLI
3. Import and use in your application
4. Customize as needed
5. Integrate with AI SDK hooks
6. Deploy and iterate

For detailed information about each component, visit the [Components Library](/components).
