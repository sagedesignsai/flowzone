# AI Elements - Usage Guide

## Learn How to Use AI Elements Components in Your Application

Once an AI Elements component is installed, you can import it and use it in your application like any other React component. The components are added as part of your codebase (not hidden in a library), so the usage feels very natural.

## Basic Example

After installing AI Elements components, you can use them in your application like any other React component.

```tsx
// app/conversation.tsx
"use client";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { useChat } from "@ai-sdk/react";

const Example = () => {
  const { messages } = useChat();

  return (
    <>
      {messages.map(({ role, parts }, index) => (
        <Message from={role} key={index}>
          <MessageContent>
            {parts.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <MessageResponse key={`${role}-${i}`}>
                      {part.text}
                    </MessageResponse>
                  );
              }
            })}
          </MessageContent>
        </Message>
      ))}
    </>
  );
};

export default Example;
```

In this example:
1. Import the `Message` component from your AI Elements directory
2. Include it in your JSX
3. Compose the component with `MessageContent` and `MessageResponse` subcomponents
4. Style or configure the component just as you would if you wrote it yourself

## Composability

AI Elements components are designed to be composed together. You can combine smaller pieces to create exactly the UI you need.

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

Benefits of composability:
- **Flexibility** - Add, remove, or rearrange pieces
- **Control** - Style and configure each part independently
- **Clarity** - Understand exactly what renders

## Extensibility

All AI Elements components take as many primitive attributes as possible. For example, the `Message` component extends `HTMLAttributes<HTMLDivElement>`, so you can pass any props that a `div` supports.

```tsx
<Message 
  from="assistant"
  className="custom-class"
  data-testid="message"
  onClick={handleClick}
>
  {/* content */}
</Message>
```

This makes it easy to extend the component with your own styles or functionality.

## Customization

Since components live in your codebase, you have full control over customization.

### Modifying Styles

If you'd like to remove the rounding on `Message`, you can go to `components/ai-elements/message.tsx` and remove `rounded-lg`:

```tsx
export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "flex flex-col gap-2 text-sm text-foreground",
      "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground group-[.is-user]:px-4 group-[.is-user]:py-3",
      className
    )}
    {...props}
  >
    <div className="is-user:dark">{children}</div>
  </div>
);
```

### Adding Functionality

You can add custom functionality by modifying the component:

```tsx
export const Message = ({ 
  from, 
  onDelete,
  ...props 
}: MessageProps) => (
  <div 
    className={cn("group", from === "user" && "is-user")}
    {...props}
  >
    {/* content */}
    {onDelete && (
      <button onClick={onDelete}>Delete</button>
    )}
  </div>
);
```

### Theming

AI Elements uses CSS variables for theming. Customize colors by modifying your `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.6%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  /* ... more variables */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 0 0% 3.6%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    /* ... more variables */
  }
}
```

## Reinstalling Components

If you re-install AI Elements by rerunning `npx ai-elements@latest`, the CLI will ask before overwriting the file so you can save any custom changes you made.

```bash
npx ai-elements@latest add message
```

The CLI will prompt:
```
✔ Checking registry.
? components/ai-elements/message.tsx already exists. Overwrite? (y/N)
```

Choose `N` to keep your customizations.

## Integration with AI SDK

AI Elements components work seamlessly with AI SDK hooks:

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="flex flex-col h-screen">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                <MessageResponse>{message.content}</MessageResponse>
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
      </Conversation>

      <PromptInput onSubmit={(msg) => sendMessage(msg)}>
        <PromptInputTextarea placeholder="Type a message..." />
        <PromptInputSubmit status={status} />
      </PromptInput>
    </div>
  );
}
```

## Common Patterns

### Conditional Rendering

```tsx
<Message from={role}>
  <MessageContent>
    {isLoading && <Shimmer />}
    {!isLoading && <MessageResponse>{text}</MessageResponse>}
  </MessageContent>
</Message>
```

### Handling Different Content Types

```tsx
<Message from="assistant">
  <MessageContent>
    {parts.map((part) => {
      switch (part.type) {
        case "text":
          return <MessageResponse key={part.id}>{part.text}</MessageResponse>;
        case "code":
          return <CodeBlock key={part.id} code={part.code} />;
        case "image":
          return <Image key={part.id} src={part.src} />;
        default:
          return null;
      }
    })}
  </MessageContent>
</Message>
```

### Streaming Content

```tsx
<Message from="assistant">
  <MessageContent>
    <MessageResponse isStreaming={isStreaming}>
      {streamingText}
    </MessageResponse>
  </MessageContent>
</Message>
```

## Best Practices

1. **Keep components focused** - Each component should have a single responsibility
2. **Use composition** - Build complex UIs from smaller components
3. **Leverage TypeScript** - Use proper types for better developer experience
4. **Test your customizations** - Verify changes work as expected
5. **Document changes** - Add comments explaining custom modifications
6. **Follow conventions** - Match existing patterns in the codebase

## Troubleshooting

### Components Not Rendering
- Check that the component file exists in `components/ai-elements/`
- Verify imports are correct
- Check browser console for errors

### Styling Issues
- Ensure Tailwind CSS is configured correctly
- Check that CSS variables are defined
- Verify class names are applied

### Type Errors
- Check that TypeScript types are imported
- Verify prop types match component interface
- Use `as const` for literal types

## Next Steps

- [Component Library](/components) - Browse all available components
- [Examples](/examples) - See real-world implementations
- [Troubleshooting](/docs/troubleshooting) - Get help with common issues
