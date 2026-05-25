# Streaming Code Output

## Overview

Stream code execution output in real-time using callbacks for stdout, stderr, and results.

## Stream stdout and stderr

Capture output as code executes:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const codeToRun = `
import time
import sys
print("This goes first to stdout")
time.sleep(3)
print("This goes later to stderr", file=sys.stderr)
time.sleep(3)
print("This goes last")
`;

const sandbox = await Sandbox.create();
sandbox.runCode(codeToRun, {
  onError: error => console.error('error:', error),
  onStdout: data => console.log('stdout:', data),
  onStderr: data => console.error('stderr:', data),
});
```

## Stream Results

Capture execution results:

```typescript
const codeToRun = `
import matplotlib.pyplot as plt

# Prepare data
categories = ['Category A', 'Category B', 'Category C', 'Category D']
values = [10, 20, 15, 25]

# Create and customize the bar chart
plt.figure(figsize=(10, 6))
plt.bar(categories, values, color='green')
plt.xlabel('Categories')
plt.ylabel('Values')
plt.title('Values by Category')

# Display the chart
plt.show()
`;

const sandbox = await Sandbox.create();
await sandbox.runCode(codeToRun, {
  onResult: result => console.log('result:', result),
});
```

## Callback Properties

Each callback receives data with:

- **stdout**: Standard output line
- **stderr**: Standard error line
- **error**: Error flag
- **timestamp**: Execution timestamp
- **line**: Output content

## Common Patterns

### Monitor Long-Running Code

```typescript
await sandbox.runCode(longRunningCode, {
  onStdout: (data) => {
    console.log('Progress:', data.line);
  },
});
```

### Collect All Output

```typescript
const output = [];

await sandbox.runCode(code, {
  onStdout: (data) => {
    output.push(data.line);
  },
});

console.log('Full output:', output.join(''));
```

### Handle Errors

```typescript
await sandbox.runCode(code, {
  onError: (error) => {
    console.error('Execution error:', error);
  },
  onStderr: (data) => {
    console.error('Error output:', data.line);
  },
});
```

## Best Practices

1. **Non-blocking callbacks**: Use async operations
2. **Error handling**: Handle all callback errors
3. **Performance**: Avoid heavy processing in callbacks
4. **Resource cleanup**: Clean up resources after execution
5. **Timeout handling**: Set appropriate timeouts
