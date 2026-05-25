# Running Commands in Background

## Overview

Run long-running commands in the background without blocking execution.

## Basic Background Execution

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();

// Start the command in the background
const command = await sandbox.commands.run('echo hello; sleep 10; echo world', {
  background: true,
  onStdout: (data) => {
    console.log(data);
  },
});

// Kill the command
await command.kill();
```

## Start Background Command

Run a command without waiting for completion:

```typescript
const command = await sandbox.commands.run('npm start', {
  background: true,
});

// Command is running in background
console.log('Server started');
```

## Monitor Background Command

Stream output from background command:

```typescript
const command = await sandbox.commands.run('long-running-task', {
  background: true,
  onStdout: (data) => {
    console.log('Task output:', data);
  },
  onStderr: (data) => {
    console.error('Task error:', data);
  },
});

// Do other work while command runs
await doOtherWork();

// Kill when done
await command.kill();
```

## Kill Background Command

Stop a running background command:

```typescript
const command = await sandbox.commands.run('sleep 3600', {
  background: true,
});

// Later, kill the command
await command.kill();
```

## Common Patterns

### Start Server

```typescript
const server = await sandbox.commands.run('npm start', {
  background: true,
  onStdout: (data) => {
    if (data.includes('listening')) {
      console.log('Server ready');
    }
  },
});

// Use the server
await makeRequest('http://localhost:3000');

// Stop server
await server.kill();
```

### Run Multiple Commands

```typescript
const cmd1 = await sandbox.commands.run('npm install', {
  background: true,
});

const cmd2 = await sandbox.commands.run('npm build', {
  background: true,
});

// Wait for both
await Promise.all([cmd1, cmd2]);
```

### Parallel Execution

```typescript
const commands = [
  sandbox.commands.run('task1', { background: true }),
  sandbox.commands.run('task2', { background: true }),
  sandbox.commands.run('task3', { background: true }),
];

const results = await Promise.all(commands);
```

### Timeout Handling

```typescript
const command = await sandbox.commands.run('long-task', {
  background: true,
});

// Set timeout
const timeout = setTimeout(async () => {
  await command.kill();
  console.log('Command timed out');
}, 30000);

// Wait for completion
await command;
clearTimeout(timeout);
```

### Monitor and Control

```typescript
const command = await sandbox.commands.run('process', {
  background: true,
  onStdout: (data) => {
    console.log(data);
  },
});

// Check status periodically
const checkStatus = setInterval(async () => {
  // Your status check logic
}, 5000);

// Stop monitoring and kill
clearInterval(checkStatus);
await command.kill();
```

## Use Cases

### Development Server

```typescript
const devServer = await sandbox.commands.run('npm run dev', {
  background: true,
  onStdout: (data) => {
    if (data.includes('ready')) {
      console.log('Dev server ready');
    }
  },
});

// Run tests while server is running
await runTests();

// Stop server
await devServer.kill();
```

### Build Process

```typescript
const build = await sandbox.commands.run('npm run build', {
  background: true,
  onStdout: (data) => {
    console.log('Build:', data);
  },
});

// Do other work
await uploadArtifacts();

// Wait for build
await build;
```

### Continuous Monitoring

```typescript
const monitor = await sandbox.commands.run('tail -f /var/log/app.log', {
  background: true,
  onStdout: (data) => {
    if (data.includes('ERROR')) {
      console.error('Application error:', data);
    }
  },
});

// Monitor runs continuously
// Stop when needed
await monitor.kill();
```

## Performance Considerations

- Background commands don't block execution
- Multiple commands can run in parallel
- Monitor resource usage
- Clean up commands when done
- Use appropriate timeouts

## Best Practices

1. **Always kill**: Stop background commands when done
2. **Monitor output**: Stream output for debugging
3. **Error handling**: Handle command failures
4. **Resource cleanup**: Clean up resources
5. **Timeout management**: Set appropriate timeouts
6. **Parallel limits**: Don't run too many parallel commands
7. **Status tracking**: Track command status

## Limitations

- Background commands continue until killed
- No automatic cleanup
- Resource limits apply
- Maximum concurrent commands may be limited
- Some commands may not work in background mode
