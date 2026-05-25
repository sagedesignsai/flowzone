# Supported Languages

## Overview

E2B Code Interpreter supports multiple programming languages for code execution in sandboxes.

## Supported Languages

- **Python** - Data science, scripting, automation
- **JavaScript/TypeScript** - Web development, Node.js
- **R** - Statistical analysis, data visualization
- **Java** - Enterprise applications
- **Bash** - Shell scripting, system commands

## Running Code

Use the `runCode()` method to execute code:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const result = await sandbox.runCode('print("Hello, world!")');
console.log(result);
```

## Specify Language

Pass the `language` parameter:

```typescript
// Python (default)
await sandbox.runCode('print("Hello")', { language: 'python' });

// JavaScript
await sandbox.runCode('console.log("Hello")', { language: 'javascript' });

// TypeScript
await sandbox.runCode('const x: number = 5;', { language: 'typescript' });

// R
await sandbox.runCode('print("Hello")', { language: 'r' });

// Java
await sandbox.runCode('System.out.println("Hello");', { language: 'java' });

// Bash
await sandbox.runCode('echo "Hello"', { language: 'bash' });
```

## Language-Specific Features

### Python
- Full Python 3 support
- Data science libraries (NumPy, Pandas, Matplotlib)
- Package installation via pip

### JavaScript/TypeScript
- Top-level await
- ESM-style imports
- Automatic promise resolution
- Package installation via npm

### R
- Statistical computing
- Data visualization
- Package management

### Java
- Full Java support
- Compilation and execution
- Package management

### Bash
- Shell scripting
- System commands
- File operations

## Common Use Cases

### Data Analysis (Python)

```typescript
const code = `
import pandas as pd
import numpy as np

data = {'A': [1, 2, 3], 'B': [4, 5, 6]}
df = pd.DataFrame(data)
print(df.mean())
`;

await sandbox.runCode(code, { language: 'python' });
```

### Web Development (JavaScript)

```typescript
const code = `
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello'));
`;

await sandbox.runCode(code, { language: 'javascript' });
```

### Statistical Analysis (R)

```typescript
const code = `
data <- c(1, 2, 3, 4, 5)
mean(data)
`;

await sandbox.runCode(code, { language: 'r' });
```

## Best Practices

1. **Choose appropriate language**: Select based on use case
2. **Install dependencies**: Use package managers
3. **Handle errors**: Implement error handling
4. **Set timeouts**: Prevent long-running code
5. **Stream output**: Monitor execution progress
6. **Clean up resources**: Remove temporary files

## Performance Considerations

- Language startup time varies
- Python: Slower startup, fast execution
- JavaScript: Fast startup and execution
- R: Moderate startup, good for statistics
- Java: Slower startup, fast execution
- Bash: Very fast startup

## Limitations

- Some libraries may not be available
- Network access depends on sandbox configuration
- Resource limits apply
- Execution timeouts enforced
