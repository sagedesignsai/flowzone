# Commands Overview

## Overview

Run terminal commands inside the sandbox using the `commands.run()` method.

## Basic Usage

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const result = await sandbox.commands.run('ls -l');
console.log(result);
```

## Command Result

The result object contains:

- **stdout**: Standard output from the command
- **stderr**: Standard error output
- **exitCode**: Exit code of the command
- **runtime**: Time taken to execute

## Available Operations

- [Streaming command output](/docs/commands/streaming)
- [Run commands in background](/docs/commands/background)

## Common Commands

### List Files

```typescript
const result = await sandbox.commands.run('ls -la /home/user');
console.log(result.stdout);
```

### Execute Scripts

```typescript
const result = await sandbox.commands.run('python script.py');
console.log(result.stdout);
```

### Run Multiple Commands

```typescript
const result = await sandbox.commands.run('cd /app && npm install && npm start');
```

### Check Exit Code

```typescript
const result = await sandbox.commands.run('test -f /path/to/file');
if (result.exitCode === 0) {
  console.log('File exists');
} else {
  console.log('File not found');
}
```

## Error Handling

```typescript
try {
  const result = await sandbox.commands.run('invalid-command');
  if (result.exitCode !== 0) {
    console.error('Command failed:', result.stderr);
  }
} catch (error) {
  console.error('Error running command:', error);
}
```

## Best Practices

1. **Check exit codes**: Always verify command success
2. **Handle errors**: Implement proper error handling
3. **Use absolute paths**: Specify full paths for files
4. **Timeout handling**: Set appropriate timeouts
5. **Resource cleanup**: Clean up after commands
6. **Stream output**: Use streaming for long-running commands
7. **Background tasks**: Use background mode for long operations

## Performance Considerations

- Commands execute sequentially by default
- Use background mode for parallel execution
- Stream output for real-time feedback
- Monitor resource usage
- Set appropriate timeouts

## Common Use Cases

1. **File operations**: List, copy, move files
2. **Package management**: Install dependencies
3. **Build processes**: Compile code
4. **Testing**: Run test suites
5. **Deployment**: Deploy applications
6. **Monitoring**: Check system status
