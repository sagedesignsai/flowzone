# Start & Ready Commands

## Overview
Define running processes for the sandbox using start and ready commands.

## Start Command

The start command is the main process that runs when the sandbox starts. It typically runs a server or application that should be continuously available.

## Ready Command

The ready command determines when the sandbox is ready for use. It waits for the start command to be fully initialized before returning control.

## Usage

```typescript
// Set both start command and ready command
template.setStartCmd('npm start', waitForPort(3000));

// Set custom start and ready command
template.setStartCmd('npm start', 'curl -s -o /dev/null -w "200"');

// Set only ready command
template.setReadyCmd(waitForTimeout(10_000));
```

## Ready Command Helpers

E2B provides helper functions for common ready command scenarios:

```typescript
import {
  waitForPort,
  waitForProcess,
  waitForFile,
  waitForTimeout,
} from 'e2b';

// Wait for a port to be available
waitForPort(3000);

// Wait for a process to be running
waitForProcess('node');

// Wait for a file to exist
waitForFile('/tmp/ready');

// Wait for a timeout
waitForTimeout(10_000); // 10 seconds
```

## Common Patterns

### Web Server

```typescript
template.setStartCmd(
  'npm start',
  waitForPort(3000)
);
```

### API Server

```typescript
template.setStartCmd(
  'npm run server',
  waitForPort(8080)
);
```

### Database

```typescript
template.setStartCmd(
  'mongod --bind_ip 0.0.0.0',
  waitForPort(27017)
);
```

### Custom Health Check

```typescript
template.setStartCmd(
  'npm start',
  'curl -s http://localhost:3000/health | grep -q "ok"'
);
```

### Process Monitoring

```typescript
template.setStartCmd(
  'npm start',
  waitForProcess('node')
);
```

### File-Based Ready

```typescript
template.setStartCmd(
  'npm start',
  waitForFile('/tmp/app-ready')
);
```

## Best Practices

1. **Use appropriate ready command**: Choose the right helper for your use case
2. **Set reasonable timeouts**: Avoid too short or too long timeouts
3. **Test ready commands**: Verify they work correctly
4. **Handle failures gracefully**: Implement error handling
5. **Monitor startup time**: Track how long startup takes
6. **Document requirements**: Explain what the start command does

## Troubleshooting

### Sandbox Never Becomes Ready

- Check if start command is running correctly
- Verify ready command is checking the right condition
- Increase timeout if startup is slow
- Review logs for errors

### Port Not Available

- Ensure application binds to correct port
- Check for port conflicts
- Verify firewall settings
- Review application configuration

### Process Not Found

- Verify process name is correct
- Check if process starts successfully
- Review application logs
- Ensure required dependencies are installed

## Advanced Usage

### Multiple Ready Conditions

```typescript
// Wait for port AND process
template.setStartCmd(
  'npm start',
  'curl -s http://localhost:3000 && pgrep node'
);
```

### Conditional Ready

```typescript
// Wait for file OR timeout
template.setStartCmd(
  'npm start',
  'test -f /tmp/ready || sleep 10'
);
```

### Custom Script

```typescript
// Use custom script for complex logic
template.copy('ready-check.sh', '/ready-check.sh');
template.runCmd('chmod +x /ready-check.sh');
template.setStartCmd(
  'npm start',
  '/ready-check.sh'
);
```
