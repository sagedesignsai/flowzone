# Message

Normalized message format with text, AST, author, and metadata.

Incoming messages are normalized across all platforms into a consistent `Message` object.

## Properties

- `id` - Platform message ID
- `threadId` - Thread ID in `adapter:channel:thread` format
- `text` - Plain text content
- `formatted` - mdast AST representation
- `raw` - Original platform-specific payload
- `author` - Message author info
- `metadata` - Timestamps and edit status
- `attachments` - File attachments (optional)
- `links` - Link previews (optional)
- `isMention` - Whether the bot was @-mentioned (optional)

## Author

- `userId` - Platform user ID
- `userName` - Username
- `fullName` - Full name
- `isBot` - Whether the author is a bot
- `isMe` - Whether the message is from the bot itself

### How `isMe` works

Each adapter detects whether a message came from the bot itself:

| Platform | Detection method |
| --- | --- |
| Slack | Checks `event.user === botUserId`, then `event.bot_id === botId` |
| Teams | Checks `activity.from.id === appId` or ends with `:{appId}` |
| Google Chat | Checks `message.sender.name === botUserId` |

All adapters return `false` if the bot ID isn't known yet.

## MessageMetadata

- `dateSent` - When the message was sent
- `edited` - Whether the message was edited
- `editedAt` - When it was edited

## Attachment

- `type` - Attachment type (e.g., "image", "file")
- `url` - Public URL (optional)
- `name` - Filename (optional)
- `mimeType` - MIME type (optional)
- `size` - File size in bytes (optional)
- `fetchData()` - Download the file data (optional)

## LinkPreview

Links found in incoming messages are extracted as `LinkPreview` objects:

- `url` - Link URL
- `title` - Link title (optional)
- `description` - Link description (optional)
- `imageUrl` - Preview image (optional)
- `siteName` - Site name (optional)
- `fetchMessage()` - Retrieve linked message (optional, Slack only)

## Serialization

Messages can be serialized for workflow engines:

```typescript
// Serialize
const json = message.toJSON();

// Deserialize
const restored = Message.fromJSON(json);
```

---

**Source:** https://chat-sdk.dev/docs/api/message
