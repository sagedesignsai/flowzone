# Build

## Overview
Describes how to build E2B templates and manage the build process.

## Build and Wait for Completion

Build a template synchronously and wait for completion:

```typescript
const buildInfo = await Template.build(template, 'my-template', {
  cpuCount: 2,              // CPU cores
  memoryMB: 2048,           // Memory in MB
  skipCache: false,         // Configure cache skip (except for files)
  onBuildLogs: defaultBuildLogger(), // Log callback receives LogEntry objects
  apiKey: 'your-api-key',   // Override API key
  domain: 'your-domain',    // Override domain
});

// buildInfo contains: { name, templateId, buildId }
```

## Build in Background

Start a build without waiting for completion:

```typescript
const buildInfo = await Template.buildInBackground(template, 'my-template', {
  cpuCount: 2,
  memoryMB: 2048,
});

// Returns immediately with: { name, templateId, buildId }
```

## Check Build Status

Poll the status of a background build:

```typescript
const status = await Template.getBuildStatus(buildInfo, {
  logsOffset: 0, // Optional: offset for fetching logs
});

// status contains: { status: 'building' | 'ready' | 'error', logEntries: [...] }
```

## Example: Background Build with Status Polling

```typescript
// Start build in background
const buildInfo = await Template.buildInBackground(template, 'my-template', {
  cpuCount: 2,
  memoryMB: 2048,
});

// Poll for build status
let logsOffset = 0;
let status = 'building';

while (status === 'building') {
  const buildStatus = await Template.getBuildStatus(buildInfo, {
    logsOffset,
  });

  logsOffset += buildStatus.logEntries.length;
  status = buildStatus.status;

  buildStatus.logEntries.forEach(
    (logEntry) => console.log(logEntry.toString())
  );

  // Wait for a short period before checking the status again
  await new Promise(resolve => setTimeout(resolve, 2000));
}

if (status === 'ready') {
  console.log('Build completed successfully');
} else {
  console.error('Build failed');
}
```

## Build Parameters

- **cpuCount**: Number of CPU cores to allocate during build (affects build speed)
- **memoryMB**: Memory in megabytes to allocate during build
- **skipCache**: Skip caching for faster rebuilds (except for files)
- **onBuildLogs**: Callback function to receive build log entries
- **apiKey**: Override the default API key
- **domain**: Override the default domain

## Best Practices

1. Use background builds for long-running builds to avoid blocking
2. Monitor build status with appropriate polling intervals
3. Allocate sufficient CPU and memory for faster builds
4. Use caching to speed up subsequent builds
5. Handle build errors gracefully
