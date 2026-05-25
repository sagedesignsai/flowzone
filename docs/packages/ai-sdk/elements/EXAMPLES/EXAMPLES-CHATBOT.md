# AI Elements - Chatbot Example

Build a chatbot with reasoning, web search, citations, and model selection.

## Overview

This example demonstrates how to create a full-featured chatbot using AI Elements and the AI SDK. It includes:

- **Chat Interface** - Conversation with streaming responses
- **Web Search** - Search the web for current information
- **Citations** - Display sources for information
- **Reasoning** - Show AI thinking process
- **Model Selection** - Choose different AI models
- **File Attachments** - Support for uploading files
- **Message Branching** - Multiple response versions
- **Tool Integration** - Display tool usage and results

## Setup

Create a new Next.js project with Tailwind CSS:

```bash
npx create-next-app@latest ai-chatbot && cd ai-chatbot
```

Install AI Elements:

```bash
npx ai-elements@latest
```

Install AI SDK dependencies:

```bash
npm i ai @ai-sdk/react zod
```

### Configuration

Create `.env.local` and add your AI Gateway API key:

```env
AI_GATEWAY_API_KEY=your_api_key_here
```

## Key Components

### Conversation & Message
Display chat history with streaming support.

```tsx
<Conversation>
  <ConversationContent>
    {messages.map((message) => (
      <Message from={message.from} key={message.key}>
        <MessageContent>
          <MessageResponse>{message.content}</MessageResponse>
        </MessageContent>
      </Message>
    ))}
  </ConversationContent>
  <ConversationScrollButton />
</Conversation>
```

### PromptInput
Rich input with attachments, model selection, and web search.

```tsx
<PromptInput onSubmit={handleSubmit}>
  <PromptInputHeader>
    <PromptInputAttachmentsDisplay />
  </PromptInputHeader>
  <PromptInputBody>
    <PromptInputTextarea value={text} onChange={handleTextChange} />
  </PromptInputBody>
  <PromptInputFooter>
    <PromptInputTools>
      <PromptInputActionMenu>
        <PromptInputActionMenuTrigger />
        <PromptInputActionMenuContent>
          <PromptInputActionAddAttachments />
        </PromptInputActionMenuContent>
      </PromptInputActionMenu>
      <SpeechInput onTranscriptionChange={handleTranscriptionChange} />
      <PromptInputButton onClick={toggleWebSearch}>
        <GlobeIcon size={16} />
        <span>Search</span>
      </PromptInputButton>
      <ModelSelector>
        {/* Model selection UI */}
      </ModelSelector>
    </PromptInputTools>
    <PromptInputSubmit disabled={isSubmitDisabled} status={status} />
  </PromptInputFooter>
</PromptInput>
```

### Sources
Display citations and sources for information.

```tsx
<Sources>
  <SourcesTrigger count={sources.length} />
  <SourcesContent>
    {sources.map((source) => (
      <Source
        href={source.href}
        key={source.href}
        title={source.title}
      />
    ))}
  </SourcesContent>
</Sources>
```

### Reasoning
Show the AI's thinking process.

```tsx
<Reasoning duration={10}>
  <ReasoningTrigger />
  <ReasoningContent>
    The user is asking for a detailed explanation...
  </ReasoningContent>
</Reasoning>
```

### ModelSelector
Choose from available AI models.

```tsx
<ModelSelector open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
  <ModelSelectorTrigger asChild>
    <PromptInputButton>
      <ModelSelectorLogo provider={selectedModel.provider} />
      <ModelSelectorName>{selectedModel.name}</ModelSelectorName>
    </PromptInputButton>
  </ModelSelectorTrigger>
  <ModelSelectorContent>
    <ModelSelectorInput placeholder="Search models..." />
    <ModelSelectorList>
      {models.map((model) => (
        <ModelSelectorItem key={model.id} value={model.id}>
          <ModelSelectorLogo provider={model.provider} />
          <ModelSelectorName>{model.name}</ModelSelectorName>
        </ModelSelectorItem>
      ))}
    </ModelSelectorList>
  </ModelSelectorContent>
</ModelSelector>
```

### Attachments
Handle file uploads and display.

```tsx
<Attachments variant="inline">
  {attachments.files.map((attachment) => (
    <Attachment key={attachment.id} data={attachment}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  ))}
</Attachments>
```

### Suggestions
Quick-start prompts for users.

```tsx
<Suggestions>
  {suggestions.map((suggestion) => (
    <Suggestion
      key={suggestion}
      suggestion={suggestion}
      onClick={handleSuggestionClick}
    />
  ))}
</Suggestions>
```

### MessageBranch
Display multiple response versions.

```tsx
<MessageBranch defaultBranch={0}>
  <MessageBranchContent>
    {versions.map((version) => (
      <Message key={version.id} from="assistant">
        <MessageContent>{version.content}</MessageContent>
      </Message>
    ))}
  </MessageBranchContent>
  {versions.length > 1 && (
    <MessageBranchSelector>
      <MessageBranchPrevious />
      <MessageBranchPage />
      <MessageBranchNext />
    </MessageBranchSelector>
  )}
</MessageBranch>
```

## Server Implementation

Create `app/api/chat/route.ts` to handle chat requests:

```typescript
import { streamText, UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
  }: {
    messages: UIMessage[];
    model: string;
    webSearch: boolean;
  } = await req.json();

  const result = streamText({
    model: webSearch ? "perplexity/sonar" : model,
    messages: await convertToModelMessages(messages),
    system:
      "You are a helpful assistant that can answer questions and help with tasks",
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
```

## Features

### Web Search
Enable web search for current information:

```tsx
const handleWebSearchToggle = () => {
  setUseWebSearch(!useWebSearch);
};
```

### File Attachments
Support multiple file types:

```tsx
const handleFileAttachment = (files: File[]) => {
  // Process files
};
```

### Speech Input
Convert speech to text:

```tsx
<SpeechInput
  onTranscriptionChange={handleTranscriptionChange}
  size="icon-sm"
  variant="ghost"
/>
```

### Model Selection
Choose from multiple AI providers:

- OpenAI (GPT-4o, GPT-4o Mini)
- Anthropic (Claude Opus, Claude Sonnet)
- Google (Gemini 2.0 Flash)

## Next Steps

- Add custom system prompts
- Implement conversation history management
- Add export functionality
- Create conversation templates
- Add user preferences and settings
