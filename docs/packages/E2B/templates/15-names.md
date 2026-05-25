# Template Names

## Overview
Understanding and managing template names in E2B.

## What is a Template Name?

A template name is the identifier used to build and reference templates:

```typescript
// Build a template with a name
await Template.build(template, 'my-python-env', {
  cpuCount: 2,
  memoryMB: 2048,
});

// Create a sandbox using the name
const sandbox = await Sandbox.create('my-python-env');
```

## Team-Local Naming

Template names are scoped to your team:

- `my-app` - Team-local template
- `your-team-slug/my-app` - Full namespaced reference
- `team-slug/template-name` - Explicit team reference

## Common Use Cases

### Development and Production Environments

```typescript
// Development template
await Template.build(template, 'myapp-dev', {
  cpuCount: 1,
  memoryMB: 1024,
});

// Production template
await Template.build(template, 'myapp-prod', {
  cpuCount: 4,
  memoryMB: 4096,
});
```

### Multiple Template Variants

```typescript
// Small instance
await Template.build(template, 'myapp-small', {
  cpuCount: 1,
  memoryMB: 512,
});

// Large instance
await Template.build(template, 'myapp-large', {
  cpuCount: 8,
  memoryMB: 16384,
});
```

## Checking Name Availability

Check if a template name is available:

```typescript
import { Template } from 'e2b';

const exists = await Template.exists('my-template');
console.log(`Name ${exists ? 'is taken' : 'is available'}`);
```

## Best Practices

### Naming Conventions

1. **Use descriptive names**: `python-ml-env` instead of `env1`
2. **Include version info**: `myapp:v1`, `myapp:v2`
3. **Use lowercase**: Stick to lowercase letters and hyphens
4. **Avoid special characters**: Use only alphanumeric and hyphens
5. **Be consistent**: Follow a naming pattern across templates

### Naming Patterns

```typescript
// Pattern: {app}-{environment}
'api-dev'
'api-prod'
'api-staging'

// Pattern: {app}:{version}
'myapp:v1'
'myapp:v2'
'myapp:latest'

// Pattern: {app}-{variant}
'myapp-small'
'myapp-medium'
'myapp-large'

// Pattern: {team}/{app}
'team-slug/myapp'
'team-slug/api-server'
```

## Template Naming Strategy

1. **Identify environments**: dev, staging, prod
2. **Plan variants**: small, medium, large
3. **Version templates**: v1, v2, latest
4. **Use consistent prefixes**: Group related templates
5. **Document naming**: Share conventions with team

## Renaming Templates

Templates cannot be renamed directly. Instead:

1. Build new template with desired name
2. Test new template
3. Update references to use new name
4. Delete old template if no longer needed

## Organizing Templates

Group templates by:
- **Application**: `api-*`, `web-*`, `worker-*`
- **Environment**: `*-dev`, `*-prod`, `*-staging`
- **Version**: `*:v1`, `*:v2`, `*:latest`
- **Size**: `*-small`, `*-medium`, `*-large`

## Example: Complete Naming Strategy

```typescript
// Development environment - small
await Template.build(template, 'myapp-dev-small', {
  cpuCount: 1,
  memoryMB: 1024,
});

// Development environment - large
await Template.build(template, 'myapp-dev-large', {
  cpuCount: 4,
  memoryMB: 4096,
});

// Production environment - small
await Template.build(template, 'myapp-prod-small', {
  cpuCount: 2,
  memoryMB: 2048,
});

// Production environment - large
await Template.build(template, 'myapp-prod-large', {
  cpuCount: 8,
  memoryMB: 8192,
});
```

## Cleanup

Regularly review and clean up unused templates to:
- Reduce storage costs
- Improve organization
- Avoid confusion
- Maintain clarity
