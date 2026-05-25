# Bash

## Overview

Run Bash shell scripts inside the sandbox for system commands and automation.

## Basic Usage

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sbx = await Sandbox.create();
const execution = await sbx.runCode('echo "Hello, world!"', { language: 'bash' });
console.log(execution);
```

## Features

- Full Bash support
- System command execution
- File operations
- Environment variables
- Piping and redirection

## File Operations

```typescript
const code = `
mkdir -p /tmp/test
echo "Hello" > /tmp/test/file.txt
cat /tmp/test/file.txt
`;

await sbx.runCode(code, { language: 'bash' });
```

## Environment Variables

```typescript
const code = `
export MY_VAR="Hello"
echo $MY_VAR
`;

await sbx.runCode(code, { language: 'bash' });
```

## Piping and Redirection

```typescript
const code = `
echo -e "line1\nline2\nline3" | grep "line2"
`;

await sbx.runCode(code, { language: 'bash' });
```

## System Information

```typescript
const code = `
echo "Hostname: $(hostname)"
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"
`;

await sbx.runCode(code, { language: 'bash' });
```

## Best Practices

1. Use proper error handling
2. Quote variables properly
3. Use functions for reusability
4. Handle exit codes
5. Clean up temporary files
