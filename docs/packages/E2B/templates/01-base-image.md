# Base Image

## Overview
Defines how to set up the base image for your E2B template. The base image is the foundation upon which all template configurations are built.

## Creating a Template

```typescript
const template = Template({
  fileContextPath: ".",
  fileIgnorePatterns: [".git", "node_modules"],
});
```

Use `fileIgnorePatterns` to exclude files from the build context, similar to `.dockerignore`.

## Defining Base Image

### Predefined Base Images

E2B provides convenient methods for common base images:

```typescript
template.fromUbuntuImage("22.04");      // ubuntu:22.04
template.fromDebianImage("stable-slim"); // debian:stable-slim
template.fromPythonImage("3.13");        // python:3.13
template.fromNodeImage("lts");           // node:lts
template.fromBunImage("1.3");            // oven/bun:1.3
```

### Custom Base Image

Use any Docker image as your base:

```typescript
template.fromImage("custom-image:latest");
```

### Default E2B Base Image

```typescript
template.fromBaseImage(); // e2bdev/base
```

### Build from Existing Template

Reference another template as your base:

```typescript
template.fromTemplate("my-template");           // Your team's template
template.fromTemplate("acme/other-template");   // Full namespaced reference
```

## Parsing Existing Dockerfiles

Convert existing Dockerfiles to E2B templates using `fromDockerfile()`:

```typescript
const dockerfileContent = `
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y curl
WORKDIR /app
COPY . .
ENV NODE_ENV=production
ENV PORT=3000
USER appuser`;

const template = Template()
  .fromDockerfile(dockerfileContent)
  .setStartCmd("npm start", waitForTimeout(5_000));
```

### Supported Dockerfile Instructions

| Instruction | Supported | Behavior |
| --- | --- | --- |
| `FROM` | ✓ | Sets base image |
| `RUN` | ✓ | Converts to `runCmd()` |
| `COPY` / `ADD` | ✓ | Converts to `copy()` |
| `WORKDIR` | ✓ | Converts to `setWorkdir()` |
| `USER` | ✓ | Converts to `setUser()` |
| `ENV` | ✓ | Converts to `setEnvs()` (supports both `ENV key=value` and `ENV key value` formats) |
| `CMD` / `ENTRYPOINT` | ✓ | Converts to `setStartCmd()` with 20 seconds timeout |
| `EXPOSE` | ✗ | Not supported |
| `VOLUME` | ✗ | Not supported |

## Key Points

- Base images must be compatible with `linux/amd64` platform
- Choose base images based on your application requirements
- Predefined images are optimized for E2B sandboxes
- Dockerfile parsing supports limited instruction set
