# Watch Directory for Changes

## Overview

Monitor directories for file changes in real-time using `files.watchDir()`.

## Basic Usage

```typescript
import { Sandbox, FilesystemEventType } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const dirname = '/home/user';

// Start watching directory for changes
const handle = await sandbox.files.watchDir(dirname, async (event) => {
  console.log(event);
  if (event.type === FilesystemEventType.WRITE) {
    console.log(`wrote to file ${event.name}`);
  }
});

// Trigger file write event
await sandbox.files.write(`${dirname}/my-file`, 'hello');
```

## Event Types

Available filesystem event types:

- **CREATE**: File or directory created
- **WRITE**: File written or modified
- **DELETE**: File or directory deleted
- **RENAME**: File or directory renamed
- **CHMOD**: File permissions changed

## Event Object

Each event contains:

```typescript
{
  type: FilesystemEventType,  // Event type
  name: string,               // File/directory name
  path: string,               // Full path
  timestamp: number           // Event timestamp
}
```

## Recursive Watching

Watch directory and all subdirectories:

```typescript
import { Sandbox, FilesystemEventType } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const dirname = '/home/user';

// Start watching directory recursively
const handle = await sandbox.files.watchDir(
  dirname,
  async (event) => {
    console.log(event);
    if (event.type === FilesystemEventType.WRITE) {
      console.log(`wrote to file ${event.name}`);
    }
  },
  { recursive: true }
);

// Trigger file write event in subdirectory
await sandbox.files.write(`${dirname}/my-folder/my-file`, 'hello');
```

## Stop Watching

Stop monitoring a directory:

```typescript
const handle = await sandbox.files.watchDir(dirname, (event) => {
  console.log(event);
});

// Stop watching
await handle.stop();
```

## Common Patterns

### Watch for Specific File Types

```typescript
const handle = await sandbox.files.watchDir(dirname, async (event) => {
  if (event.name.endsWith('.log')) {
    console.log(`Log file changed: ${event.name}`);
  }
});
```

### Collect File Changes

```typescript
const changes = [];

const handle = await sandbox.files.watchDir(dirname, async (event) => {
  changes.push({
    type: event.type,
    file: event.name,
    timestamp: event.timestamp
  });
});

// Later, access collected changes
console.log(changes);
```

### React to Specific Events

```typescript
const handle = await sandbox.files.watchDir(dirname, async (event) => {
  switch (event.type) {
    case FilesystemEventType.CREATE:
      console.log(`Created: ${event.name}`);
      break;
    case FilesystemEventType.WRITE:
      console.log(`Modified: ${event.name}`);
      break;
    case FilesystemEventType.DELETE:
      console.log(`Deleted: ${event.name}`);
      break;
    case FilesystemEventType.RENAME:
      console.log(`Renamed: ${event.name}`);
      break;
  }
});
```

### Watch Multiple Directories

```typescript
const handle1 = await sandbox.files.watchDir('/app/src', (event) => {
  console.log(`Source changed: ${event.name}`);
});

const handle2 = await sandbox.files.watchDir('/app/dist', (event) => {
  console.log(`Build output changed: ${event.name}`);
});

// Stop both
await handle1.stop();
await handle2.stop();
```

## Use Cases

### Monitor Build Output

```typescript
const handle = await sandbox.files.watchDir('/app/dist', async (event) => {
  if (event.type === FilesystemEventType.CREATE) {
    console.log(`Build artifact created: ${event.name}`);
  }
});
```

### Track Log Files

```typescript
const handle = await sandbox.files.watchDir('/app/logs', async (event) => {
  if (event.name.endsWith('.log')) {
    const content = await sandbox.files.read(event.path);
    console.log(`Log updated: ${content}`);
  }
});
```

### Monitor Configuration Changes

```typescript
const handle = await sandbox.files.watchDir('/app/config', async (event) => {
  if (event.type === FilesystemEventType.WRITE) {
    console.log(`Configuration updated: ${event.name}`);
    // Reload configuration
  }
});
```

## Performance Considerations

- Watching large directories may impact performance
- Recursive watching generates more events
- Filter events to reduce processing
- Stop watching when no longer needed
- Consider event debouncing for high-frequency changes

## Best Practices

1. **Stop watching**: Always stop watching when done
2. **Filter events**: Only process relevant events
3. **Handle errors**: Implement error handling in callbacks
4. **Avoid blocking**: Use async operations in callbacks
5. **Debounce**: Debounce rapid file changes
6. **Resource cleanup**: Clean up watchers on sandbox shutdown

## Limitations

- Watching may have slight delays
- Some rapid changes may be coalesced
- Network latency affects event delivery
- Maximum number of concurrent watchers may be limited
