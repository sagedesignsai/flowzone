# JavaScript and TypeScript

## Overview

Run JavaScript and TypeScript code inside the sandbox using the `runCode()` method.

## Basic Usage

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sbx = await Sandbox.create();
const execution = await sbx.runCode('console.log("Hello, world!")');
console.log(execution);
```

## Features

- TypeScript support with top-level await
- ESM-style imports
- Automatic promise resolution
- npm package installation
- Full Node.js compatibility

## JavaScript Example

```typescript
const code = `
const axios = require('axios');
const response = await axios.get('https://api.github.com/status');
console.log(response.data);
`;

await sbx.runCode(code, { language: 'javascript' });
```

## TypeScript Example

```typescript
const code = `
import axios from 'axios';

const url: string = 'https://api.github.com/status';
const response = await axios.get(url);
console.log(response.data);
`;

await sbx.runCode(code, { language: 'typescript' });
```

## Install Packages

```typescript
await sbx.commands.run('npm install axios');
const code = `
const axios = require('axios');
const data = await axios.get('https://api.example.com');
console.log(data);
`;

await sbx.runCode(code);
```

## Best Practices

1. Use async/await for asynchronous operations
2. Install dependencies before use
3. Handle promise rejections
4. Use TypeScript for type safety
5. Stream output for monitoring
