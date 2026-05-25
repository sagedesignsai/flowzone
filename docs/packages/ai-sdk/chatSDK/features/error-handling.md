# Error handling

Handle rate limits, unsupported features, and other errors from adapters.

The SDK provides typed error classes for common failure scenarios. All errors are importable from the `chat` package.

```typescript
import { ChatError, RateLimitError, NotImplementedError, LockError } from "chat";
```

## Error types

### ChatError

Base error class for all SDK errors. Every error below extends `ChatError`.

### RateLimitError

Thrown when a platform API returns a 429 response. The `retryAfterMs` property tells you how long to wait before retrying.

```typescript
import { RateLimitError } from "chat";

try {
  await thread.post("Hello!");
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited, retry after ${error.retryAfterMs}ms`);
  }
}
```

### NotImplementedError

Thrown when you call a feature that a platform doesn't support. For example, calling `addReaction()` on Teams or `schedule()` on adapters without native scheduling support.

```typescript
import { NotImplementedError } from "chat";

try {
  await thread.addReaction(emoji.thumbs_up);
} catch (error) {
  if (error instanceof NotImplementedError) {
    console.log(`Feature not supported: ${error.feature}`);
  }
}
```

See the feature matrix for which features are supported on each platform.

### LockError

Thrown when the SDK fails to acquire a distributed lock on a thread (used to prevent concurrent processing of messages in the same thread). You can control this behavior with the `onLockConflict` option — set it to `'force'` to release the existing lock instead of throwing.

## Adapter errors

Adapters also throw specialized errors from the `@chat-adapter/shared` package:

| Error | Code | Description |
| --- | --- | --- |
| `AdapterRateLimitError` | `RATE_LIMITED` | Platform rate limit hit, includes `retryAfter` in seconds |
| `AuthenticationError` | `AUTH_FAILED` | Invalid or expired credentials |
| `ResourceNotFoundError` | `NOT_FOUND` | Requested resource doesn't exist |
| `PermissionError` | `PERMISSION_DENIED` | Bot lacks required permissions/scopes |
| `ValidationError` | `VALIDATION_ERROR` | Invalid input data |
| `NetworkError` | `NETWORK_ERROR` | Connectivity issue with platform API |

## Catching errors

Use `instanceof` to handle specific error types:

```typescript
import { RateLimitError, NotImplementedError } from "chat";

bot.onNewMention(async (thread, message) => {
  try {
    await thread.post("Processing...");
    await thread.addReaction(emoji.eyes);
  } catch (error) {
    if (error instanceof RateLimitError) {
      // Wait and retry
      await new Promise((r) => setTimeout(r, error.retryAfterMs ?? 5000));
      await thread.post("Processing...");
    } else if (error instanceof NotImplementedError) {
      // Skip unsupported features gracefully
    } else {
      throw error;
    }
  }
});
```

---

**Source:** https://chat-sdk.dev/docs/error-handling
