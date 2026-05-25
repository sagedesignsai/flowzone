# Streaming Command Output

## Overview

Stream command output in real-time using `onStdout` and `onStderr` callbacks.

## Basic Streaming

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();

const result = await sandbox.commands.run('echo hello; sleep 1; echo world', {
  onStdout: (data) => {
    console.log(data);
  },
  onStderr: (data) => {
    console.log(data);
  },
});
console.log(result);
```

## Stream Standard Output

Capture stdout in real-time:

```typescript
const result = await sandbox.commands.run('npm install', {
  onStdout: (data) => {
    console.log('Output:', data);
  },
});
```

## Stream Standard Error

Capture stderr in real-time:

```typescript
const result = await sandbox.commands.run('npm install', {
  onStderr: (data) => {
    console.error('Error:', data);
  },
});
```

## Stream Both Outputs

Handle both stdout and stderr:

```typescript
const result = await sandbox.commands.run('build-script.sh', {
  onStdout: (data) => {
    console.log('[OUT]', data);
  },
  onStderr: (data) => {
    console.log('[ERR]', data);
  },
});
```

## Common Patterns

### Collect Output

```typescript
const output = [];

await sandbox.commands.run('ls -la', {
  onStdout: (data) => {
    output.push(data);
  },
});

console.log('Full output:', output.join(''));
```

### Filter Output

```typescript
await sandbox.commands.run('npm install', {
  onStdout: (data) => {
    if (data.includes('error')) {
      console.error('Installation error:', data);
    }
  },
});
```

### Real-time Progress

```typescript
let progress = 0;

await sandbox.commands.run('long-running-task', {
  onStdout: (data) => {
    if (data.includes('Progress:')) {
      progress++;
      console.log(`Progress: ${progress}%`);
    }
  },
});
```

### Log to File

```typescript
import fs from 'fs';

const logStream = fs.createWriteStream('command.log');

await sandbox.commands.run('npm build', {
  onStdout: (data) => {
    logStream.write(data);
  },
  onStderr: (data) => {
    logStream.write(`[ERROR] ${data}`);
  },
});

logStream.end();
```

### Parse JSON Output

```typescript
let jsonBuffer = '';

await sandbox.commands.run('node script.js', {
  onStdout: (data) => {
    jsonBuffer += data;
    try {
      const json = JSON.parse(jsonBuffer);
      console.log('Parsed:', json);
      jsonBuffer = '';
    } catch (e) {
      // Incomplete JSON, wait for more data
    }
  },
});
```

## Use Cases

### Monitor Build Process

```typescript
await sandbox.commands.run('npm run build', {
  onStdout: (data) => {
    if (data.includes('compiled')) {
      console.log('Build step completed');
    }
  },
  onStderr: (data) => {
    console.error('Build error:', data);
  },
});
```

### Track Installation Progress

```typescript
await sandbox.commands.run('npm install', {
  onStdout: (data) => {
    if (data.includes('added')) {
      console.log('Packages installed:', data);
    }
  },
});
```

### Debug Test Execution

```typescript
await sandbox.commands.run('npm test', {
  onStdout: (data) => {
    console.log('[TEST]', data);
  },
  onStderr: (data) => {
    console.error('[TEST ERROR]', data);
  },
});
```

## Performance Considerations

- Streaming adds minimal overhead
- Process data as it arrives
- Avoid blocking operations in callbacks
- Use async callbacks for I/O operations
- Buffer data if needed for processing

## Best Practices

1. **Handle both streams**: Monitor stdout and stderr
2. **Non-blocking callbacks**: Use async operations
3. **Error handling**: Properly handle stream errors
4. **Resource cleanup**: Close streams when done
5. **Data buffering**: Buffer incomplete data
6. **Performance**: Avoid heavy processing in callbacks

## Limitations

- Callbacks are called as data arrives
- Data may be chunked
- Order of stdout/stderr may vary
- Some buffering may occur
