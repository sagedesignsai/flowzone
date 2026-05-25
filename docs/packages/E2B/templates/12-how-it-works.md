# How It Works

## Overview
Explains the template building process and key concepts in E2B.

## General Overview

E2B templates define custom sandboxes with pre-configured environments. The build process:

1. **Template Definition**: Define template using SDK
2. **File Upload**: Upload local files to build environment
3. **Build Execution**: Execute build steps (install packages, run commands)
4. **Image Creation**: Create Docker image from build
5. **Template Storage**: Store template for sandbox creation
6. **Sandbox Instantiation**: Create sandboxes from template

## Default User and Workdir

The default user in templates is `user` with `/home/user` as the working directory. This differs from Docker defaults:

- **Docker default**: `root` user with `/` workdir
- **E2B default**: `user` user with `/home/user` workdir

This design improves security and helps with tool installation.

Example:

```typescript
const sbx = await Sandbox.create();
await sbx.commands.run("whoami");  // user
await sbx.commands.run("pwd");     // /home/user
```

## Caching

E2B uses intelligent caching to speed up builds:

- **Layer caching**: Each operation creates a cacheable layer
- **File caching**: Files are checked for changes
- **Invalidation**: Changing an operation invalidates subsequent layers
- **Reuse**: Identical operations reuse cached layers

Cached operations:
- `.copy()`
- `.runCmd()`
- `.setEnvs()`

## Kernel

The kernel version depends on template build date:

| Build Date | Kernel Version |
| --- | --- |
| ≥ 27.11.2025 | 6.1.158 (current) |
| < 27.11.2025 | 6.1.102 |

## Build Process Flow

```
Template Definition
        ↓
File Context Preparation
        ↓
Upload Files
        ↓
Execute Build Steps
        ↓
Create Docker Image
        ↓
Store Template
        ↓
Ready for Sandbox Creation
```

## Template Lifecycle

1. **Definition**: Create template using SDK
2. **Building**: Execute build process
3. **Storage**: Template stored in E2B infrastructure
4. **Instantiation**: Create sandboxes from template
5. **Execution**: Run code in sandbox
6. **Cleanup**: Sandbox destroyed after use

## Performance Optimization

1. **Caching**: Leverage caching for faster rebuilds
2. **Resource Allocation**: Allocate sufficient CPU/memory
3. **File Optimization**: Exclude unnecessary files
4. **Operation Ordering**: Place changing operations last
5. **Parallel Builds**: Build multiple variants in parallel

## Key Concepts

- **Template**: Reusable sandbox configuration
- **Sandbox**: Running instance of a template
- **Build**: Process of creating a template
- **Layer**: Cacheable step in build process
- **Image**: Docker image created from template

## Best Practices

1. Define templates for common environments
2. Use caching to speed up builds
3. Allocate appropriate resources
4. Test templates before production use
5. Version templates with tags
6. Monitor build performance
7. Clean up unused templates
