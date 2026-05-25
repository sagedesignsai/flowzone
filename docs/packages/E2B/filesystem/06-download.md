# Download Data from Sandbox

## Overview

Download files and data from the sandbox filesystem to your local system.

## Basic Download

Read a file from sandbox and write to local filesystem:

```typescript
import fs from 'fs';
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();

// Read file from sandbox
const content = await sandbox.files.read('/path/in/sandbox');
// Write file to local filesystem
fs.writeFileSync('/local/path', content);
```

## Download Multiple Files

Download multiple files:

```typescript
import fs from 'fs';
import path from 'path';
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();

const filesToDownload = [
  '/app/output.txt',
  '/app/result.json',
  '/app/data.csv'
];

for (const filePath of filesToDownload) {
  const content = await sandbox.files.read(filePath);
  const fileName = path.basename(filePath);
  fs.writeFileSync(`/local/downloads/${fileName}`, content);
}
```

## Download with Pre-signed URL

Allow users to download files securely using pre-signed URLs:

```typescript
import { Sandbox } from '@e2b/code-interpreter';

// Start a secured sandbox
const sandbox = await Sandbox.create(template, { secure: true });

// Create a pre-signed URL for file download with 10 second expiration
const publicUrl = await sandbox.downloadUrl('demo.txt', {
  useSignatureExpiration: 10_000, // optional
});

// Download file with pre-signed URL (can be used in browser)
const res = await fetch(publicUrl);
const content = await res.text();
```

## Download Directory

Download all files from a directory:

```typescript
import fs from 'fs';
import path from 'path';
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();

async function downloadDirectory(sandboxPath, localPath) {
  // Create local directory if it doesn't exist
  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(localPath, { recursive: true });
  }

  // List files in sandbox directory
  const files = await sandbox.files.list(sandboxPath);

  for (const file of files) {
    if (file.isFile) {
      const content = await sandbox.files.read(file.path);
      const localFilePath = path.join(localPath, file.name);
      fs.writeFileSync(localFilePath, content);
    } else if (file.isDir) {
      const subLocalPath = path.join(localPath, file.name);
      await downloadDirectory(file.path, subLocalPath);
    }
  }
}

// Usage
await downloadDirectory('/app/output', '/local/downloads');
```

## Common Patterns

### Download Build Artifacts

```typescript
import fs from 'fs';

const artifacts = [
  '/app/dist/bundle.js',
  '/app/dist/styles.css',
  '/app/dist/index.html'
];

for (const artifact of artifacts) {
  const content = await sandbox.files.read(artifact);
  fs.writeFileSync(`./build/${artifact.split('/').pop()}`, content);
}
```

### Download Logs

```typescript
const logContent = await sandbox.files.read('/app/logs/app.log');
fs.writeFileSync('./logs/sandbox-output.log', logContent);
```

### Download Results

```typescript
const results = await sandbox.files.read('/app/results.json');
const data = JSON.parse(results);
console.log('Results:', data);
```

### Download with Compression

```typescript
import zlib from 'zlib';
import fs from 'fs';

const content = await sandbox.files.read('/app/large-file.txt');
const compressed = zlib.gzipSync(content);
fs.writeFileSync('./large-file.txt.gz', compressed);
```

## Pre-signed URL Features

### Set Expiration Time

```typescript
const url = await sandbox.downloadUrl('file.txt', {
  useSignatureExpiration: 60_000, // 60 seconds
});
```

### Use in Browser

```html
<a href="<pre-signed-url>" download>Download File</a>
```

### Use in JavaScript

```typescript
const url = await sandbox.downloadUrl('file.txt', {
  useSignatureExpiration: 300_000, // 5 minutes
});

// Create download link
const link = document.createElement('a');
link.href = url;
link.download = 'file.txt';
link.click();
```

### Share with Others

```typescript
const url = await sandbox.downloadUrl('report.pdf', {
  useSignatureExpiration: 3600_000, // 1 hour
});

// Share URL with others
console.log(`Download link: ${url}`);
```

## Error Handling

```typescript
try {
  const content = await sandbox.files.read('/path/to/file');
  fs.writeFileSync('/local/path', content);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('File not found in sandbox');
  } else if (error.code === 'EACCES') {
    console.error('Permission denied');
  } else {
    console.error('Download failed:', error);
  }
}
```

## Best Practices

1. **Verify file existence**: Check if file exists before downloading
2. **Handle large files**: Consider streaming for large files
3. **Set expiration**: Always set expiration for pre-signed URLs
4. **Validate content**: Validate downloaded content
5. **Error handling**: Implement proper error handling
6. **Clean up**: Remove temporary files after processing
7. **Monitor bandwidth**: Track download sizes

## Performance Considerations

- Large file downloads may take time
- Batch downloads when possible
- Consider compression for large files
- Use streaming for very large files
- Monitor network bandwidth

## Security Considerations

- Validate downloaded content
- Use pre-signed URLs with expiration
- Verify file integrity (checksums)
- Scan downloaded files for malware
- Implement rate limiting for downloads
- Restrict access to sensitive files

## Common Use Cases

1. **Retrieve build artifacts**: Download compiled code
2. **Get execution results**: Download computation results
3. **Collect logs**: Download application logs
4. **Export data**: Download processed data
5. **Share outputs**: Share results with others via pre-signed URLs

## Limitations

- Maximum file size depends on available memory
- Pre-signed URLs have expiration times
- Network latency affects download speed
- Some special characters may need escaping
