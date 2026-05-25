# Template Tags & Versioning

## Overview
Use tags to version your templates and manage environment-based deployments.

## Tag Format

Templates can be referenced with tags:

```
name:tag
```

Examples:

```
my-template:v1.0.0          // Within your team
my-template:production      // Within your team
acme/my-template:v1.0.0     // Full namespaced reference
```

## The Default Tag

If no tag is specified, the `default` tag is used:

```typescript
// These are equivalent
const sandbox1 = await Sandbox.create('my-template');
const sandbox2 = await Sandbox.create('my-template:default');
```

## Building with Tags

### Single Tag

```typescript
import { Template } from 'e2b';

// Build with a specific version tag
await Template.build(template, 'my-template:v1.0.0');
```

### Multiple Tags

```typescript
import { Template } from 'e2b';

// Build with multiple tags pointing to the same artifact
await Template.build(template, 'my-template', { 
  tags: ['v1.2.0', 'latest'] 
});
```

## Managing Tags

### Assign Tags

```typescript
import { Template } from 'e2b';

// Assign a single tag
await Template.assignTags('my-template:v1.2.0', 'production');

// Assign multiple tags at once
await Template.assignTags('my-template:v1.2.0', ['production', 'stable']);
```

### Remove Tags

```typescript
import { Template } from 'e2b';

// Remove a tag
await Template.removeTags('my-template', 'staging');
```

## Use Cases

### Semantic Versioning

```typescript
// Release versions
await Template.build(template, 'api-server:v1.0.0');
await Template.build(template, 'api-server:v1.1.0');
await Template.build(template, 'api-server:v2.0.0');

// Create sandbox from specific version
const sandbox = await Sandbox.create('api-server:v1.1.0');
```

### Environment Tags

```typescript
// Build new version
await Template.build(template, 'my-app:v1.5.0');

// Promote through environments
await Template.assignTags('my-app:v1.5.0', 'staging');

// After testing, promote to production
await Template.assignTags('my-app:v1.5.0', 'production');

// Use in your application
const env = process.env.NODE_ENV;
const sandbox = await Sandbox.create(`my-app:${env}`);
```

### Latest and Stable Tags

```typescript
// Build with version and latest tag
await Template.build(template, 'my-tool', { 
  tags: ['v3.0.0', 'latest'] 
});

// Mark a tested version as stable
await Template.assignTags('my-tool:v2.9.0', 'stable');

// You can choose your risk tolerance
const latestSandbox = await Sandbox.create('my-tool:latest');   // Newest
const stableSandbox = await Sandbox.create('my-tool:stable');   // Tested
```

## Tagging Strategy

### Version Tags

```
v1.0.0
v1.1.0
v2.0.0
```

### Environment Tags

```
dev
staging
production
```

### Status Tags

```
latest
stable
beta
alpha
```

### Custom Tags

```
feature-x
hotfix-123
release-candidate
```

## Best Practices

1. **Use semantic versioning**: Follow semver for version tags
2. **Tag releases**: Always tag production releases
3. **Use meaningful names**: Choose descriptive tag names
4. **Document tags**: Explain what each tag represents
5. **Automate tagging**: Use CI/CD to automate tag assignment
6. **Clean up old tags**: Remove unused tags regularly
7. **Promote carefully**: Test before promoting to production

## Tag Lifecycle

```
Build → v1.0.0 → staging → production
                    ↓
                  testing
                    ↓
                  approved
```

## Example: Complete Tagging Workflow

```typescript
// 1. Build new version
const buildInfo = await Template.build(template, 'myapp:v2.0.0', {
  cpuCount: 4,
  memoryMB: 4096,
});

// 2. Tag as latest
await Template.assignTags('myapp:v2.0.0', 'latest');

// 3. Deploy to staging
await Template.assignTags('myapp:v2.0.0', 'staging');

// 4. Run tests...

// 5. Promote to production
await Template.assignTags('myapp:v2.0.0', 'production');

// 6. Mark as stable
await Template.assignTags('myapp:v2.0.0', 'stable');

// 7. Create sandboxes from different tags
const devSandbox = await Sandbox.create('myapp:latest');
const prodSandbox = await Sandbox.create('myapp:production');
const stableSandbox = await Sandbox.create('myapp:stable');
```

## Querying Tags

List all tags for a template:

```typescript
// Note: This is a conceptual example
// Check E2B SDK documentation for actual API
const tags = await Template.listTags('myapp');
```

## Cleanup

Remove old tags to maintain organization:

```typescript
// Remove old version tags
await Template.removeTags('myapp', 'v1.0.0');
await Template.removeTags('myapp', 'v1.1.0');

// Keep only recent versions
// v2.0.0, v2.1.0, v2.2.0
```
