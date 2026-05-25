# Caching

## Overview
E2B templates use intelligent caching to speed up build times. Caching applies to `.copy()`, `.runCmd()`, and `.setEnvs()` operations.

## Cache Invalidation

### Partial Cache Invalidation

Skip cache for specific operations:

```typescript
const template = Template()
  .fromBaseImage()
  .skipCache()
  .runCmd("echo 'Hello, World!'");
```

### Whole Template Cache Invalidation

Skip cache for the entire template build:

```typescript
Template.build(template, 'my-template', {
  skipCache: true, // Configure cache skip (except for files)
});
```

## Files Caching

Files are always re-uploaded by default. Force re-upload with `forceUpload`:

```typescript
const template = Template()
  .fromBaseImage()
  .copy("config.json", "/app/config.json", { forceUpload: true });
```

## Use Case for Caching

Caching is particularly useful when building multiple template variants with different resource allocations:

```typescript
// Build with 2 CPU and 2GB memory
await Template.build(template, 'my-template-2cpu-2gb', {
  cpuCount: 2,
  memoryMB: 2048,
});

// Build with 1 CPU and 4GB memory - reuses cached layers
await Template.build(template, 'my-template-1cpu-4gb', {
  cpuCount: 1,
  memoryMB: 4096,
});
```

## Optimize Build Times

1. **Leverage caching**: Structure templates to maximize cache hits
2. **Order operations**: Place frequently changing operations last
3. **Use skipCache strategically**: Only skip cache when necessary
4. **Batch operations**: Group similar operations together
5. **Reuse templates**: Build new templates from existing ones

## Cache Behavior

- Cache is based on template definition and file content
- Changing any operation invalidates subsequent cache layers
- File uploads always check for changes
- Cache persists across builds of the same template name
- Different template names have separate caches
