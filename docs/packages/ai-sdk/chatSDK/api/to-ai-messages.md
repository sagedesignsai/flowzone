# toAiMessages

Convert Chat SDK messages to AI SDK conversation format.

Convert an array of `Message` objects into the `{ role, content }[]` format expected by AI SDKs.

```typescript
import { toAiMessages } from "chat";
```

## Usage

```typescript
import { toAiMessages } from "chat";

bot.onSubscribedMessage(async (thread, message) => {
  const result = await thread.adapter.fetchMessages(thread.id, { limit: 20 });
  const history = await toAiMessages(result.messages);
  const response = await agent.stream({ prompt: history });
  await thread.post(response.fullStream);
});
```

## Signature

```typescript
function toAiMessages(
  messages: Message[],
  options?: ToAiMessagesOptions
): Promise<AiMessage[]>
```

## Behavior

- **Role mapping** — `author.isMe === true` maps to `"assistant"`, all others to `"user"`
- **Filtering** — Messages with empty or whitespace-only text are removed
- **Sorting** — Messages are sorted chronologically (oldest first) by `metadata.dateSent`
- **Links** — Link metadata is appended to message content
- **Attachments** — Images and text files are included as multipart content

## Return types

```typescript
type AiMessage = AiUserMessage | AiAssistantMessage;

interface AiUserMessage {
  role: "user";
  content: string | AiMessagePart[];
}

interface AiAssistantMessage {
  role: "assistant";
  content: string;
}
```

## Options

- `includeNames` - Prefix each user message with their username
- `transformMessage` - Transform each message before returning
- `onUnsupportedAttachment` - Handle unsupported attachment types

## Examples

### Multi-user context

```typescript
const history = await toAiMessages(result.messages, { includeNames: true });
// [{ role: "user", content: "[alice]: Hello" },
//  { role: "assistant", content: "Hi there!" },
//  { role: "user", content: "[bob]: Thanks" }]
```

### Transforming messages

```typescript
const history = await toAiMessages(result.messages, {
  transformMessage: (aiMessage) => {
    if (typeof aiMessage.content === "string") {
      return {
        ...aiMessage,
        content: aiMessage.content.replace(/<@U123>/g, "@VercelBot"),
      };
    }
    return aiMessage;
  },
});
```

### Filtering messages

```typescript
const history = await toAiMessages(result.messages, {
  transformMessage: (aiMessage, source) => {
    if (source.author.userId === "U_NOISY_BOT") return null;
    return aiMessage;
  },
});
```

## Supported attachment types

| Type | MIME types | Included as |
| --- | --- | --- |
| `image` | Any image MIME type | FilePart with base64 data |
| `file` | text/*, application/json, application/xml, etc. | FilePart with base64 data |
| `video` | Any | Skipped |
| `audio` | Any | Skipped |

---

**Source:** https://chat-sdk.dev/docs/api/to-ai-messages
