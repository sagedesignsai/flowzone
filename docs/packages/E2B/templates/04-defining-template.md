# Defining Template

## Overview
Guide to creating and configuring E2B templates with various operations and configurations.

## Method Chaining

All template methods return the template instance, enabling fluent API usage:

```typescript
const template = Template()
  .fromUbuntuImage("22.04")
  .aptInstall(["curl"]) // necessary for waitForPort
  .setWorkdir('/app')
  .copy("package.json", "/app/package.json")
  .runCmd("npm install")
  .setStartCmd("npm start", waitForPort(3000));
```

## User and Workdir

Set the working directory and user for the template:

```typescript
// Set working directory
template.setWorkdir("/app");

// Set user (runs subsequent commands as this user)
template.setUser('node');
template.setUser("1000:1000"); // User ID and group ID
```

## Copying Files

Copy files from your local filesystem to the template:

```typescript
// Copy a single file
template.copy("package.json", "/app/package.json");

// Copy multiple files to same destination
template.copy(["file1", "file2"], "/app/file");

// Multiple copy operations using copyItems
template.copyItems([
  { src: "src/", dest: "/app/src/" },
  { src: "package.json", dest: "/app/package.json" },
]);

// Copy with user and mode options
template.copy("config.json", "/app/config.json", {
  user: "appuser",
  mode: 0o644,
});
```

## File Operations

Perform various file operations during template build:

```typescript
// Remove files or directories
template.remove("/tmp/temp-file.txt");
template.remove("/old-directory", { recursive: true });
template.remove("/file.txt", { force: true });

// Rename files or directories
template.rename("/old-name.txt", "/new-name.txt");
template.rename("/old-dir", "/new-dir", { force: true });

// Create directories
template.makeDir("/app/logs");
template.makeDir("/app/data", { mode: 0o755 });

// Create symbolic links
template.makeSymlink("/app/data", "/app/logs/data");
```

## Installing Packages

Install packages using package managers:

```typescript
// Install Python packages
template.pipInstall(['requests', 'pandas', 'numpy']);
template.pipInstall(['requests', 'pandas', 'numpy'], { g: false }); // user

// Install Node.js packages
template.npmInstall(['express', 'lodash']);
template.npmInstall(['express', 'lodash'], { g: true }); // global

// Install Bun packages
template.bunInstall(['express', 'lodash']);
template.bunInstall(['express', 'lodash'], { g: true }); // global

// Install system packages (automatically runs apt update)
template.aptInstall(['curl', 'wget', 'git']);
```

## Git Operations

Clone Git repositories during template build (requires `git` to be installed):

```typescript
// Clone a repository
template.gitClone('https://github.com/user/repo.git');

// Clone a repository to a specific path
template.gitClone('https://github.com/user/repo.git', '/app/repo');

// Clone a specific branch
template.gitClone('https://github.com/user/repo.git', '/app/repo', {
  branch: 'main',
});

// Shallow clone with depth limit
template.gitClone('https://github.com/user/repo.git', '/app/repo', {
  depth: 1,
});
```

## Environment Variables

Environment variables set in template definition are only available during template build. See sandbox documentation for runtime environment variables.

Set environment variables in the template:

```typescript
template.setEnvs({
  NODE_ENV: 'production',
  API_KEY: 'your-api-key',
  DEBUG: 'true',
});
```

## Running Commands

Execute shell commands during template build:

```typescript
// Run a single command
template.runCmd('apt-get update && apt-get install -y curl');

// Run multiple commands
template.runCmd(['apt-get update', 'apt-get install -y curl', 'curl --version']);

// Run commands as a specific user
template.runCmd('npm install', { user: 'node' });
```

## Best Practices

1. Use method chaining for cleaner code
2. Set user and workdir early in template definition
3. Group related operations together
4. Use specific package versions when possible
5. Clean up temporary files to reduce image size
6. Order operations to maximize cache efficiency
