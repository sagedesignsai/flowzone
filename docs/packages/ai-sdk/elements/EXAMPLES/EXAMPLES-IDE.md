# AI Elements - IDE Example

Build an AI-powered IDE with file navigation, code display, terminal output, and an integrated chat assistant.

## Overview

This example demonstrates how to create a complete IDE interface using AI Elements components. It includes:

- **File Tree Navigation** - Hierarchical file structure with expandable folders
- **Code Display** - Syntax-highlighted code with line numbers
- **Terminal Output** - Streaming build output with ANSI color support
- **Plan Component** - AI implementation strategy visualization
- **Task Queue** - Organize pending and completed tasks
- **Chat Interface** - Streaming chat with AI responses
- **Checkpoints** - Mark and restore conversation states

## Setup

Create a new Next.js project with Tailwind CSS:

```bash
npx create-next-app@latest ai-ide && cd ai-ide
```

Install AI Elements:

```bash
npx ai-elements@latest
```

Install dependencies:

```bash
npm i nanoid shiki lucide-react
```

## Key Components

### FileTree
Displays a hierarchical file structure with expandable folders and file selection.

```tsx
<FileTree
  expanded={expandedPaths}
  onExpandedChange={setExpandedPaths}
  onSelect={handleFileSelect}
  selectedPath={selectedPath}
>
  <FileTreeFolder name="src" path="src">
    <FileTreeFile name="app.tsx" path="src/app.tsx" />
  </FileTreeFolder>
</FileTree>
```

### CodeBlock
Renders syntax-highlighted code with line numbers and copy button.

```tsx
<CodeBlock
  code={currentFile.content}
  language={currentFile.language}
  showLineNumbers
/>
```

### Terminal
Shows streaming build output with ANSI color support.

```tsx
<Terminal
  isStreaming={isTerminalStreaming}
  output={terminalOutput}
>
  <TerminalContent />
</Terminal>
```

### Plan
Displays the AI's implementation strategy with collapsible sections.

```tsx
<Plan defaultOpen>
  <PlanHeader>
    <PlanTitle>Implementation Plan</PlanTitle>
    <PlanDescription>Adding form validation</PlanDescription>
  </PlanHeader>
  <PlanContent>
    {/* Plan content */}
  </PlanContent>
</Plan>
```

### Queue
Organizes pending and completed tasks in separate sections.

```tsx
<Queue>
  <QueueSection defaultOpen>
    <QueueSectionTrigger>
      <QueueSectionLabel label="Pending" count={pendingTasks.length} />
    </QueueSectionTrigger>
    <QueueSectionContent>
      {/* Task items */}
    </QueueSectionContent>
  </QueueSection>
</Queue>
```

### Conversation & Message
Creates a streaming chat experience.

```tsx
<Conversation>
  <ConversationContent>
    {messages.map((message) => (
      <Message from={message.from} key={message.key}>
        <MessageContent>
          {message.from === "assistant" ? (
            <MessageResponse>{message.content}</MessageResponse>
          ) : (
            message.content
          )}
        </MessageContent>
      </Message>
    ))}
  </ConversationContent>
</Conversation>
```

### Checkpoint
Allows users to mark and restore conversation states.

```tsx
<Checkpoint>
  <CheckpointIcon />
  <CheckpointTrigger tooltip="Restore to this checkpoint">
    Checkpoint saved
  </CheckpointTrigger>
</Checkpoint>
```

## Layout Structure

The IDE uses a three-panel layout:

1. **Left Sidebar** - File tree navigation
2. **Center Panel** - Code block and terminal output
3. **Right Sidebar** - Plan, task queue, and chat interface

## Streaming Support

All components support real-time streaming for responsive user experience:

```tsx
const streamContent = async (messageKey, content) => {
  const words = content.split(" ");
  let currentContent = "";

  for (const word of words) {
    currentContent += (currentContent ? " " : "") + word;
    updateMessage(messageKey, currentContent);
    await delay(Math.random() * 40 + 20);
  }
};
```

## Next Steps

- Connect to a real AI backend using the AI SDK
- Add file editing capabilities
- Implement multiple tabs for open files
- Add syntax error highlighting
- Create custom themes
