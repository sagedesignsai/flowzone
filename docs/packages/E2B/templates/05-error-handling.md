# Error Handling

## Overview
Handle errors that occur during template building and operations.

## Error Types

E2B provides specific error types for different failure scenarios:

```typescript
import { AuthError, BuildError, FileUploadError } from 'e2b';

try {
  await Template.build(template, 'my-template');
} catch (error) {
  if (error instanceof AuthError) {
    console.error("Authentication failed:", error.message);
  } else if (error instanceof FileUploadError) {
    console.error("File upload failed:", error.message);
  } else if (error instanceof BuildError) {
    console.error("Build failed:", error.message);
  }
}
```

## Common Error Scenarios

### Authentication Error
Occurs when API key is invalid or missing:
- Invalid E2B_API_KEY
- Expired credentials
- Missing authentication

### File Upload Error
Occurs when files cannot be uploaded to the build environment:
- File too large
- Network connectivity issues
- Permission denied

### Build Error
Occurs when template build fails:
- Command execution failure
- Package installation failure
- Resource constraints
- Invalid template configuration

## Error Handling Best Practices

1. **Catch specific errors**: Use instanceof checks for specific error types
2. **Log errors**: Always log error details for debugging
3. **Retry logic**: Implement retry logic for transient failures
4. **User feedback**: Provide meaningful error messages to users
5. **Cleanup**: Clean up resources on error

## Example: Comprehensive Error Handling

```typescript
async function buildTemplateWithErrorHandling() {
  try {
    const buildInfo = await Template.build(template, 'my-template', {
      cpuCount: 2,
      memoryMB: 2048,
      onBuildLogs: defaultBuildLogger(),
    });
    
    console.log('Build successful:', buildInfo);
    return buildInfo;
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('Authentication failed. Check your API key.');
      // Handle auth error
    } else if (error instanceof FileUploadError) {
      console.error('Failed to upload files. Check file sizes and permissions.');
      // Handle upload error
    } else if (error instanceof BuildError) {
      console.error('Build failed:', error.message);
      // Handle build error
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

## Debugging Tips

1. Enable detailed logging with `defaultBuildLogger()`
2. Check API key configuration
3. Verify file permissions and sizes
4. Review template definition for syntax errors
5. Check resource allocation (CPU, memory)
6. Verify network connectivity
