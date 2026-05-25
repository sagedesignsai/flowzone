# Upload Data to Sandbox

## Overview

Upload files and data to the sandbox filesystem using `files.write()`.

## Upload Single File

Read a file from local filesystem and upload to sandbox:

```typescript
import fs from 'fs';
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();

// Read file from local filesystem
const content = fs.readFileSync('/local/path');
// Upload file to sandbox
await sandbox.files.write('/path/in/sandbox', content);
```

## Upload Multiple Files

Upload multiple files in one operation:

```typescript
import fs from 'fs';
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();

const files = [
  { path: '/app/file1.txt', data: 'content 1' },
  { path: '/app/file2.txt', data: 'content 2' },
  { path: '/app/config.json', data: JSON.stringify({ key: 'value' }) }
];

await sandbox.files.write(files);
```

## Upload with Pre-signed URL

Allow users to upload files securely using pre-signed URLs:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

// Start a secured sandbox
const sandbox = await Sandbox.create(template, { secure: true });

// Create a pre-signed URL for file upload with 10 second expiration
const publicUploadUrl = await sandbox.uploadUrl('demo.txt', {
  useSignatureExpiration: 10_000, // optional
});

// Upload a file with pre-signed URL (can be used in browser)
const form = new FormData();
form.append('file', 'file content');

await fetch(publicUploadUrl, { method: 'POST', body: form });

// File is now available in the sandbox
const content = await sandbox.files.read('/path/in/sandbox');
```

## Upload Directory / Multiple Files

Upload an entire directory:

```typescript
import fs from 'fs';
import path from 'path';
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();

// Read all files in directory
const readDirectoryFiles = (directoryPath) => {
  const files = fs.readdirSync(directoryPath);

  const filesArray = files
    .filter(file => {
      const fullPath = path.join(directoryPath, file);
      return fs.statSync(fullPath).isFile();
    })
    .map(file => {
      const filePath = path.join(directoryPath, file);
      return {
        path: filePath,
        data: fs.readFileSync(filePath, 'utf8')
      };
    });

  return filesArray;
};

// Usage
const files = readDirectoryFiles('/local/dir');
await sandbox.files.write(files);
```

## Common Patterns

### Upload Configuration Files

```typescript
const config = {
  apiKey: process.env.API_KEY,
  endpoint: 'https://api.example.com',
  debug: true
};

await sandbox.files.write(
  '/app/config.json',
  JSON.stringify(config, null, 2)
);
```

### Upload Source Code

```typescript
const sourceCode = `
function hello() {
  console.log('Hello from sandbox');
}

hello();
`;

await sandbox.files.write('/app/script.js', sourceCode);
```

### Upload Binary Files

```typescript
import fs from 'fs';

const binaryData = fs.readFileSync('/local/binary.bin');
await sandbox.files.write('/app/binary.bin', binaryData);
```

### Upload with Encoding

```typescript
const content = 'Hello, World!';
await sandbox.files.write(
  '/app/file.txt',
  Buffer.from(content, 'utf-8')
);
```

## Pre-signed URL Features

### Set Expiration Time

```typescript
const url = await sandbox.uploadUrl('file.txt', {
  useSignatureExpiration: 60_000, // 60 seconds
});
```

### Use in Browser

```html
<form action="<pre-signed-url>" method="POST" enctype="multipart/form-data">
  <input type="file" name="file" />
  <button type="submit">Upload</button>
</form>
```

### Use in JavaScript

```typescript
const file = document.getElementById('fileInput').files[0];
const form = new FormData();
form.append('file', file);

const response = await fetch(publicUploadUrl, {
  method: 'POST',
  body: form
});
```

## Error Handling

```typescript
try {
  await sandbox.files.write('/app/file.txt', 'content');
} catch (error) {
  if (error.code === 'ENOSPC') {
    console.error('Disk space full');
  } else if (error.code === 'EACCES') {
    console.error('Permission denied');
  } else {
    console.error('Upload failed:', error);
  }
}
```

## Best Practices

1. **Check disk space**: Verify available space before upload
2. **Validate content**: Validate file content before uploading
3. **Use appropriate paths**: Create necessary directories first
4. **Handle large files**: Consider chunking for large files
5. **Set expiration**: Always set expiration for pre-signed URLs
6. **Error handling**: Implement proper error handling
7. **Clean up**: Remove temporary files after processing

## Performance Considerations

- Large file uploads may take time
- Batch uploads when possible
- Monitor disk space usage
- Consider compression for large files
- Use streaming for very large files if available

## Security Considerations

- Validate file content before processing
- Use pre-signed URLs with expiration
- Restrict file types and sizes
- Scan uploaded files for malware
- Implement rate limiting for uploads
- Validate file paths to prevent traversal attacks

## Limitations

- Maximum file size depends on available disk space
- Pre-signed URLs have expiration times
- Some special characters may need escaping
- Binary files require proper encoding
