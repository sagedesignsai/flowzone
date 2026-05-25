# Read & Write Files

## Reading Files

Read files from the sandbox filesystem using the `files.read()` method:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const fileContent = await sandbox.files.read('/path/to/file');
```

## Writing Single Files

Write a single file to the sandbox filesystem:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
await sandbox.files.write('/path/to/file', 'file content');
```

## Writing Multiple Files

Write multiple files to the sandbox in one operation:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
await sandbox.files.write([
  { path: '/path/to/a', data: 'file content' },
  { path: '/another/path/to/b', data: 'file content' }
]);
```

## File Operations

### Create Directories

```typescript
// Create directory structure
await sandbox.files.write('/path/to/directory/.gitkeep', '');
```

### Overwrite Files

```typescript
// Overwrite existing file
await sandbox.files.write('/path/to/file', 'new content');
```

### Append to Files

```typescript
// Read existing content
const existing = await sandbox.files.read('/path/to/file');
// Append new content
await sandbox.files.write('/path/to/file', existing + '\nnew line');
```

## Common Patterns

### Write Configuration Files

```typescript
const config = {
  apiKey: 'key',
  endpoint: 'https://api.example.com'
};

await sandbox.files.write(
  '/app/config.json',
  JSON.stringify(config, null, 2)
);
```

### Write Script Files

```typescript
const script = `#!/bin/bash
echo "Hello from sandbox"
`;

await sandbox.files.write('/app/script.sh', script);
```

### Read and Process Files

```typescript
const content = await sandbox.files.read('/path/to/file');
const lines = content.split('\n');
const processedLines = lines.map(line => line.trim());
```

## Error Handling

```typescript
try {
  const content = await sandbox.files.read('/path/to/file');
} catch (error) {
  console.error('Failed to read file:', error);
}
```

## Best Practices

1. **Use absolute paths**: Always use absolute paths starting with `/`
2. **Create parent directories**: Ensure parent directories exist
3. **Handle encoding**: Specify encoding for text files
4. **Validate content**: Validate file content before writing
5. **Use appropriate sizes**: Be mindful of file sizes and disk space
6. **Error handling**: Implement proper error handling
7. **Clean up**: Remove temporary files when done

## Performance Considerations

- Large file operations may take time
- Batch multiple writes when possible
- Consider file size limits
- Monitor disk space usage
- Use streaming for very large files if available

## Limitations

- File paths must be absolute
- Maximum file size depends on available disk space
- Some special characters may need escaping
- Binary files require proper encoding
