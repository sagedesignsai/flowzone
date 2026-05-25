# Code Contexts

## Overview

Run code in different execution contexts to parallelize code execution. By default, code runs in the sandbox's default context.

## Create a New Code Context

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const context = await sandbox.createCodeContext({
  cwd: '/home/user',
  language: 'python',
  requestTimeoutMs: 60_000,
});

const result = await sandbox.runCode('print("Hello, world!")', { context });
console.log(result);
```

## List Active Code Contexts

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const contexts = await sandbox.listCodeContexts();
console.log(contexts);
```

## Restart a Code Context

Clear state and start a new session:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const context = await sandbox.createCodeContext({
  cwd: '/home/user',
  language: 'python',
  requestTimeoutMs: 60_000,
});

// Using context object
await sandbox.restartCodeContext(context);

// Using context ID
await sandbox.restartCodeContext(context.contextId);
```

## Remove a Code Context

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const context = await sandbox.createCodeContext({
  cwd: '/home/user',
  language: 'python',
  requestTimeoutMs: 60_000,
});

// Using context object
await sandbox.removeCodeContext(context);

// Using context ID
await sandbox.removeCodeContext(context.contextId);
```

## Common Patterns

### Parallel Execution

```typescript
const context1 = await sandbox.createCodeContext({ language: 'python' });
const context2 = await sandbox.createCodeContext({ language: 'python' });

const [result1, result2] = await Promise.all([
  sandbox.runCode('print("Task 1")', { context: context1 }),
  sandbox.runCode('print("Task 2")', { context: context2 }),
]);
```

### Isolated Environments

```typescript
// Context 1: Data processing
const dataContext = await sandbox.createCodeContext({
  cwd: '/data',
  language: 'python',
});

// Context 2: Analysis
const analysisContext = await sandbox.createCodeContext({
  cwd: '/analysis',
  language: 'python',
});
```

### Context Cleanup

```typescript
const context = await sandbox.createCodeContext({ language: 'python' });

try {
  await sandbox.runCode(code, { context });
} finally {
  await sandbox.removeCodeContext(context);
}
```

## Context Parameters

- **cwd**: Working directory
- **language**: Programming language
- **requestTimeoutMs**: Execution timeout

## Best Practices

1. **Clean up contexts**: Remove when no longer needed
2. **Isolate state**: Use separate contexts for independent tasks
3. **Parallel execution**: Leverage multiple contexts
4. **Error handling**: Handle context creation errors
5. **Resource management**: Monitor active contexts
