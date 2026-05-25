# AI Elements - v0 Clone Example

Build a v0 clone using AI Elements and the v0 Platform API.

## Overview

This example demonstrates how to create a UI generation interface similar to v0. It includes:

- **Chat Interface** - Conversation with AI for UI generation
- **Web Preview** - Live preview of generated UIs
- **Suggestions** - Quick-start prompts for users
- **File Attachments** - Support for uploading files
- **Real-time Updates** - Live preview updates as UI is generated
- **Model Selection** - Choose different AI models
- **Streaming Responses** - Real-time generation feedback

## Setup

Create a new Next.js project with Tailwind CSS:

```bash
npx create-next-app@latest v0-clone && cd v0-clone
```

Install dependencies:

```bash
npx shadcn@latest init && npx ai-elements@latest
npm i v0-sdk
```

### Configuration

Create `.env.local` and add your v0 API key:

```env
V0_API_KEY=your_api_key_here
```

Get your API key from [v0 account settings](https://v0.dev/chat/settings/keys).

## Key Components

### Conversation & Message
Display chat history with user and assistant messages.

```tsx
<Conversation>
  <ConversationContent>
    {chatHistory.map((msg) => (
      <Message from={msg.type} key={msg.id}>
        <MessageContent>{msg.content}</MessageContent>
      </Message>
    ))}
  </ConversationContent>
</Conversation>
```

### PromptInput
Rich input component with attachments and model selection.

```tsx
<PromptInput onSubmit={handleSendMessage}>
  <PromptInputTextarea
    placeholder="Describe your UI..."
    value={message}
    onChange={handleTextChange}
  />
  <PromptInputFooter>
    <PromptInputSubmit disabled={!message} />
  </PromptInputFooter>
</PromptInput>
```

### Suggestions
Quick-start prompts for users.

```tsx
<Suggestions>
  <Suggestion 
    suggestion="Create a responsive navbar with Tailwind CSS"
    onClick={handleSuggestionClick}
  />
  <Suggestion 
    suggestion="Build a todo app with React"
    onClick={handleSuggestionClick}
  />
</Suggestions>
```

### WebPreview
Live preview of generated UIs.

```tsx
<WebPreview>
  <WebPreviewNavigation>
    <WebPreviewUrl value={currentChat?.demo} />
  </WebPreviewNavigation>
  <WebPreviewBody src={currentChat?.demo} />
</WebPreview>
```

## Server Implementation

Create `app/api/v0/route.ts` to handle v0 API calls:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { v0 } from "v0-sdk";

export async function POST(request: NextRequest) {
  try {
    const { message, chatId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let chat;

    if (chatId) {
      // Continue existing chat
      chat = await v0.chats.sendMessage({
        chatId: chatId,
        message,
      });
    } else {
      // Create new chat
      chat = await v0.chats.create({
        message,
      });
    }

    return NextResponse.json({
      id: chat.id,
      demo: chat.demo,
    });
  } catch (error) {
    console.error("V0 API Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
```

## Layout

The interface uses a two-panel layout:

1. **Left Panel** - Chat conversation and input
2. **Right Panel** - Live preview of generated UI

## Features

### Chat Management
- Create new chats
- Continue existing conversations
- Display chat history

### UI Generation
- Send prompts to v0 API
- Receive generated UI code
- Display live preview

### User Experience
- Suggestions for quick starts
- Loading states during generation
- Error handling and feedback

## Customization

### Styling
Customize the WebPreview component styling:

```tsx
<WebPreview className="rounded-lg border">
  {/* Preview content */}
</WebPreview>
```

### Suggestions
Add custom suggestions for your use case:

```tsx
const suggestions = [
  "Create a dashboard with charts",
  "Build a form with validation",
  "Design a product card",
];
```

## Next Steps

- Add file attachment support
- Implement code export functionality
- Add component library integration
- Create workflow templates
- Add version history and rollback
