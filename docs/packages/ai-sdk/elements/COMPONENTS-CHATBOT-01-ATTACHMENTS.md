# Attachments Component

A flexible, composable attachment component for displaying files, images, videos, audio, and source documents.

## Overview

The `Attachment` component provides a unified way to display file attachments and source documents with multiple layout variants. It supports three display modes: grid (thumbnails), inline (badges), and list (rows).

## Installation

```bash
npx ai-elements@latest add attachments
```

## Features

- **Three display variants**: grid (thumbnails), inline (badges), and list (rows)
- **Multiple media types**: Supports FileUIPart and SourceDocumentUIPart from AI SDK
- **Automatic detection**: Media type detection (image, video, audio, document, source)
- **Hover previews**: Inline variant with hover card support
- **Remove functionality**: Customizable remove button with callback
- **Composable architecture**: Maximum flexibility for customization
- **Accessibility**: Proper ARIA labels and semantic HTML
- **TypeScript support**: Full type definitions and utility functions

## Usage with AI SDK

Display user-uploaded files in chat messages or input areas:

```tsx
"use client";

import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
  AttachmentRemove,
} from "@/components/ai-elements/attachments";
import type { FileUIPart } from "ai";

interface MessageProps {
  attachments: (FileUIPart & { id: string })[];
  onRemove?: (id: string) => void;
}

const MessageAttachments = ({ attachments, onRemove }: MessageProps) => (
  <Attachments variant="grid">
    {attachments.map((file) => (
      <Attachment
        key={file.id}
        data={file}
        onRemove={onRemove ? () => onRemove(file.id) : undefined}
      >
        <AttachmentPreview />
        <AttachmentRemove />
      </Attachment>
    ))}
  </Attachments>
);

export default MessageAttachments;
```

## Display Variants

### Grid Variant

Best for displaying attachments in messages with visual thumbnails. Shows media previews in a grid layout.

```tsx
<Attachments variant="grid">
  {/* attachment items */}
</Attachments>
```

### Inline Variant

Best for compact badge-style display in input areas with hover previews. Shows file names as badges with hover card support.

```tsx
<Attachments variant="inline">
  {/* attachment items */}
</Attachments>
```

### List Variant

Best for file lists with full metadata display. Shows files in rows with complete information.

```tsx
<Attachments variant="list">
  {/* attachment items */}
</Attachments>
```

## Component Props

### Attachments (Container)

Container component that sets the layout variant.

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `"grid" \| "inline" \| "list"` | Display layout variant |
| `children` | `React.ReactNode` | Attachment items |
| `className` | `string` | Additional CSS classes |

### Attachment (Item)

Individual attachment item wrapper.

| Prop | Type | Description |
|------|------|-------------|
| `data` | `FileUIPart \| SourceDocumentUIPart` | Attachment data |
| `onRemove` | `() => void` | Remove callback |
| `children` | `React.ReactNode` | Attachment sub-components |

### AttachmentPreview

Displays the media preview (image, video, or icon).

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Additional CSS classes |

### AttachmentInfo

Displays the filename and optional media type.

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Additional CSS classes |

### AttachmentRemove

Remove button that appears on hover.

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Additional CSS classes |

### AttachmentHoverCard

Wrapper for hover preview functionality.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Trigger and content |

### AttachmentHoverCardTrigger

Trigger element for the hover card.

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Additional CSS classes |

### AttachmentHoverCardContent

Content displayed in the hover card.

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Additional CSS classes |

### AttachmentEmpty

Empty state component when no attachments are present.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Empty state content |

## Utility Functions

### getMediaCategory(data)

Returns the media category for an attachment.

```tsx
import { getMediaCategory } from "@/components/ai-elements/attachments";

const category = getMediaCategory(attachment);
// Returns: "image" | "video" | "audio" | "document" | "source" | "unknown"
```

### getAttachmentLabel(data)

Returns the display label for an attachment.

```tsx
import { getAttachmentLabel } from "@/components/ai-elements/attachments";

const label = getAttachmentLabel(attachment);
// Returns filename or fallback like "Image" or "Attachment"
```

## Supported Media Types

- **Images**: jpg, jpeg, png, gif, webp, svg
- **Videos**: mp4, webm, ogg, mov
- **Audio**: mp3, wav, ogg, m4a, flac
- **Documents**: pdf, doc, docx, txt, xlsx, csv
- **Web**: html, htm
- **Source Documents**: From AI SDK SourceDocumentUIPart

## Accessibility

- Semantic HTML structure
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Proper color contrast ratios

## Theming

The component uses Tailwind CSS and respects your design system:

- Automatic dark mode support
- CSS variable integration
- Customizable through className prop
- Inherits theme from parent context

## Best Practices

1. **Always provide IDs**: Ensure each attachment has a unique ID for proper key handling
2. **Handle removals**: Implement onRemove callback to update parent state
3. **Choose variant wisely**: Select variant based on use case (grid for messages, inline for input)
4. **Validate file types**: Validate files before passing to component
5. **Optimize images**: Compress images for better performance
6. **Error handling**: Handle missing or corrupted files gracefully

## Common Use Cases

### Chat Message Attachments

Display files attached to chat messages:

```tsx
<Message from="user">
  <MessageContent>
    <MessageResponse>Here are the files I mentioned</MessageResponse>
    <MessageAttachments attachments={message.attachments} />
  </MessageContent>
</Message>
```

### Input Area Attachments

Show selected files in input area:

```tsx
<PromptInput>
  {selectedFiles.length > 0 && (
    <Attachments variant="inline">
      {selectedFiles.map((file) => (
        <Attachment key={file.id} data={file} onRemove={() => removeFile(file.id)}>
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  )}
</PromptInput>
```

### Document List

Display uploaded documents in a list:

```tsx
<Attachments variant="list">
  {documents.map((doc) => (
    <Attachment key={doc.id} data={doc}>
      <AttachmentPreview />
      <AttachmentInfo />
    </Attachment>
  ))}
</Attachments>
```

## Performance Considerations

- Lazy load images for better performance
- Use appropriate image sizes for each variant
- Memoize attachment lists to prevent unnecessary re-renders
- Consider virtualization for large attachment lists

## Related Components

- [Message](/docs/components/message) - Display messages with attachments
- [Prompt Input](/docs/components/prompt-input) - Input area with file support
- [Conversation](/docs/components/conversation) - Chat interface container

---

**Last Updated:** February 2026
**Component Version:** Latest
