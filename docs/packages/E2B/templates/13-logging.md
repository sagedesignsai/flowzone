# Logging

## Overview
How to view and handle logs from template builds.

## Default Logger

E2B provides a default logger to filter logs by level:

```typescript
import { Template, defaultBuildLogger } from 'e2b';

await Template.build(template, 'my-template', {
  onBuildLogs: defaultBuildLogger({
    minLevel: "info", // Minimum log level to show
  }),
});
```

## Custom Logger

Customize how logs are handled:

```typescript
// Simple logging
onBuildLogs: (logEntry) => console.log(logEntry.toString());

// Custom formatting
onBuildLogs: (logEntry) => {
  const time = logEntry.timestamp.toISOString();
  console.log(`[${time}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`);
};

// Filter by log level
onBuildLogs: (logEntry) => {
  if (logEntry.level === "error" || logEntry.level === "warn") {
    console.error(logEntry.toString());
  }
};
```

## LogEntry Structure

The `onBuildLogs` callback receives structured `LogEntry` objects:

```typescript
type LogEntryLevel = 'debug' | 'info' | 'warn' | 'error';

class LogEntry {
  constructor(
    public readonly timestamp: Date,
    public readonly level: LogEntryLevel,
    public readonly message: string
  )
  
  toString() // Returns formatted log string
}

// Indicates the start of the build process
class LogEntryStart extends LogEntry {
  constructor(timestamp: Date, message: string) {
    super(timestamp, 'debug', message);
  }
}

// Indicates the end of the build process
class LogEntryEnd extends LogEntry {
  constructor(timestamp: Date, message: string) {
    super(timestamp, 'debug', message);
  }
}
```

## Detecting Build Start and End

Use `instanceof` checks to detect build lifecycle events:

```typescript
if (logEntry instanceof LogEntryStart) {
  // Build started
  return;
}

if (logEntry instanceof LogEntryEnd) {
  // Build ended
  return;
}
```

## Log Levels

- **debug**: Detailed diagnostic information
- **info**: General informational messages
- **warn**: Warning messages for potential issues
- **error**: Error messages for failures

## Example: Comprehensive Logging

```typescript
import { Template, defaultBuildLogger, LogEntryStart, LogEntryEnd } from 'e2b';

await Template.build(template, 'my-template', {
  onBuildLogs: (logEntry) => {
    if (logEntry instanceof LogEntryStart) {
      console.log('🚀 Build started');
      return;
    }
    
    if (logEntry instanceof LogEntryEnd) {
      console.log('✅ Build completed');
      return;
    }
    
    const icon = {
      'debug': '🔍',
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
    }[logEntry.level];
    
    console.log(`${icon} [${logEntry.level.toUpperCase()}] ${logEntry.message}`);
  },
});
```

## Best Practices

1. **Use appropriate log levels**: Choose correct level for each message
2. **Filter logs**: Only show relevant logs for your use case
3. **Monitor errors**: Pay special attention to error logs
4. **Track build progress**: Use start/end events to track progress
5. **Store logs**: Save logs for debugging and analysis
6. **Format consistently**: Use consistent formatting for readability

## Troubleshooting with Logs

1. Check error logs for build failures
2. Review warning logs for potential issues
3. Use debug logs for detailed diagnostics
4. Look for patterns in repeated failures
5. Compare logs between successful and failed builds
