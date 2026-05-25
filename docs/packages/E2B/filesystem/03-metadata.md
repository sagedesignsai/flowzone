# File & Directory Metadata

## Overview

Get information about files and directories in the sandbox filesystem.

## Get File Information

Retrieve metadata about a file:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();
const fileInfo = await sandbox.files.info('/path/to/file');
```

## File Metadata

File information includes:

- **name**: File name
- **path**: Full file path
- **isDir**: Whether it's a directory
- **isFile**: Whether it's a file
- **size**: File size in bytes
- **created**: Creation timestamp
- **modified**: Last modification timestamp
- **accessed**: Last access timestamp
- **permissions**: File permissions

## List Directory Contents

List files and directories:

```typescript
const files = await sandbox.files.list('/path/to/directory');
```

## Check File Existence

```typescript
try {
  const info = await sandbox.files.info('/path/to/file');
  console.log('File exists');
} catch (error) {
  console.log('File does not exist');
}
```

## Get Directory Size

```typescript
async function getDirectorySize(path) {
  const files = await sandbox.files.list(path);
  let totalSize = 0;
  
  for (const file of files) {
    if (file.isFile) {
      totalSize += file.size;
    } else if (file.isDir) {
      totalSize += await getDirectorySize(file.path);
    }
  }
  
  return totalSize;
}
```

## Common Patterns

### Check if Path is Directory

```typescript
const info = await sandbox.files.info('/path');
if (info.isDir) {
  console.log('It is a directory');
} else {
  console.log('It is a file');
}
```

### Get File Size

```typescript
const info = await sandbox.files.info('/path/to/file');
console.log(`File size: ${info.size} bytes`);
```

### List Files Recursively

```typescript
async function listFilesRecursive(path) {
  const files = await sandbox.files.list(path);
  const result = [];
  
  for (const file of files) {
    result.push(file);
    if (file.isDir) {
      const subFiles = await listFilesRecursive(file.path);
      result.push(...subFiles);
    }
  }
  
  return result;
}
```

### Find Files by Extension

```typescript
async function findFilesByExtension(directory, extension) {
  const files = await sandbox.files.list(directory);
  return files.filter(f => f.name.endsWith(extension));
}
```

## Timestamps

Work with file timestamps:

```typescript
const info = await sandbox.files.info('/path/to/file');
const created = new Date(info.created);
const modified = new Date(info.modified);
const accessed = new Date(info.accessed);
```

## Permissions

Check file permissions:

```typescript
const info = await sandbox.files.info('/path/to/file');
console.log(`Permissions: ${info.permissions}`);
```

## Error Handling

```typescript
try {
  const info = await sandbox.files.info('/nonexistent/path');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('File not found');
  } else {
    console.error('Error:', error);
  }
}
```

## Best Practices

1. **Cache metadata**: Store metadata to avoid repeated calls
2. **Handle errors**: Properly handle file not found errors
3. **Check permissions**: Verify permissions before operations
4. **Monitor size**: Track directory sizes for cleanup
5. **Use appropriate methods**: Use list for directories, info for files

## Performance Considerations

- Listing large directories may be slow
- Recursive operations can be expensive
- Cache results when possible
- Consider pagination for large listings
- Use filters to reduce data transfer

## Common Use Cases

1. **Validate file existence**: Check before reading
2. **Monitor disk usage**: Track total size
3. **Find specific files**: Search by extension or pattern
4. **Get file timestamps**: Track modification times
5. **Check permissions**: Verify access rights
