# User and Workdir

## Overview
Default user and working directory in the sandbox and template.

## Default User and Workdir

The default user in the template is `user` with `/home/user` (home directory) as the working directory. This differs from Docker defaults:

- **Docker default**: `root` user with `/` as workdir
- **E2B default**: `user` user with `/home/user` as workdir

This design helps with tool installation and improves default security.

## Default User and Workdir in Sandbox

```typescript
const sbx = await Sandbox.create();
await sbx.commands.run("whoami");  // user
await sbx.commands.run("pwd");     // /home/user
```

## Custom User and Workdir Template

```typescript
// template.ts
const template = Template()
  .fromBaseImage()
  .runCmd("whoami")  // user
  .runCmd("pwd")     // /home/user
  .setUser("guest")
  .runCmd("whoami")  // guest
  .runCmd("pwd")     // /home/guest

// build_dev.ts
await Template.build(template, 'custom-user-template', {
  onBuildLogs: defaultBuildLogger()
});

// index.ts
const sbx = await Sandbox.create("custom-user-template");
await sbx.commands.run("whoami");  // guest
await sbx.commands.run("pwd");     // /home/guest
```

## Setting User

Change the user for subsequent commands:

```typescript
template.setUser('node');
template.setUser('1000:1000');  // User ID and group ID
```

## Setting Workdir

Change the working directory:

```typescript
template.setWorkdir('/app');
template.setWorkdir('/home/user/project');
```

## User and Workdir Persistence

The last set user and workdir in the template are persisted as defaults to the sandbox execution.

## Common Patterns

### Node.js Application

```typescript
template
  .fromNodeImage('18')
  .setUser('node')
  .setWorkdir('/app')
  .copy('package.json', '/app/package.json')
  .runCmd('npm install')
  .copy('.', '/app')
  .setStartCmd('npm start', waitForPort(3000));
```

### Python Application

```typescript
template
  .fromPythonImage('3.11')
  .setUser('python')
  .setWorkdir('/app')
  .copy('requirements.txt', '/app/requirements.txt')
  .runCmd('pip install -r requirements.txt')
  .copy('.', '/app')
  .setStartCmd('python app.py', waitForPort(5000));
```

### Multi-User Setup

```typescript
template
  .fromUbuntuImage('22.04')
  .runCmd('useradd -m -s /bin/bash appuser')
  .setUser('appuser')
  .setWorkdir('/home/appuser/app')
  .copy('app.sh', '/home/appuser/app/app.sh')
  .runCmd('chmod +x /home/appuser/app/app.sh')
  .setStartCmd('/home/appuser/app/app.sh');
```

## Security Considerations

1. **Avoid root user**: Use non-root users when possible
2. **Limit permissions**: Grant minimal required permissions
3. **Use dedicated users**: Create users for specific applications
4. **Set proper ownership**: Ensure files are owned by correct user
5. **Restrict workdir**: Use isolated working directories

## Best Practices

1. **Set user early**: Define user before copying files
2. **Use consistent workdir**: Keep workdir consistent across templates
3. **Document user requirements**: Explain why specific user is needed
4. **Test permissions**: Verify user has required permissions
5. **Use standard users**: Prefer standard users (node, python, etc.)

## Troubleshooting

### Permission Denied

- Verify user has required permissions
- Check file ownership
- Review workdir permissions
- Ensure user exists

### Command Not Found

- Verify user has PATH set correctly
- Check if command is installed
- Verify user can access command
- Review shell configuration

### File Access Issues

- Check file permissions
- Verify user ownership
- Review workdir permissions
- Ensure user is in correct groups
