# Filesystem Overview

## Overview

Each E2B Sandbox has its own isolated filesystem. Storage capacity depends on your tier:

- **Hobby tier**: 10 GB free disk space
- **Pro tier**: 20 GB disk space

## Available Operations

With E2B SDK you can:

- [Read and write files to the sandbox](/docs/filesystem/read-write)
- [Get file and directory metadata](/docs/filesystem/info)
- [Watch directory for changes](/docs/filesystem/watch)
- [Upload data to the sandbox](/docs/filesystem/upload)
- [Download data from the sandbox](/docs/filesystem/download)

## Key Features

- **Isolated filesystem**: Each sandbox has its own independent filesystem
- **Persistent storage**: Files persist for the lifetime of the sandbox
- **Secure access**: Pre-signed URLs for secure file transfers
- **File watching**: Monitor directory changes in real-time
- **Metadata access**: Get file and directory information

## Common Use Cases

1. **Code execution**: Write code files and execute them
2. **Data processing**: Upload data, process it, download results
3. **File monitoring**: Watch for file changes during execution
4. **Artifact storage**: Store build artifacts and outputs
5. **Configuration**: Upload configuration files for applications

## Best Practices

1. **Organize files**: Use clear directory structure
2. **Clean up**: Remove temporary files to save space
3. **Monitor size**: Track disk usage for large operations
4. **Use pre-signed URLs**: For secure external access
5. **Handle errors**: Implement proper error handling for file operations

## Disk Space Management

- Monitor available disk space
- Clean up temporary files
- Consider file compression for large datasets
- Plan storage for long-running operations
- Archive old files if needed

## Security Considerations

- Files are isolated per sandbox
- Use pre-signed URLs for external access
- Set expiration times for URLs
- Validate file paths to prevent traversal attacks
- Encrypt sensitive data before upload
