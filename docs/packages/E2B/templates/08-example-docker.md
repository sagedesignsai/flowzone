# Examples: Docker

## Overview
Sandbox with Docker installed for running containers.

## Install Docker

```typescript
// template.ts
import { Template } from 'e2b';

export const template = Template()
  .fromUbuntuImage('25.04')
  .runCmd('curl -fsSL https://get.docker.com | sudo sh')
  .runCmd('sudo docker run --rm hello-world');
```

## Build Script

```typescript
// build.ts
import { Template, defaultBuildLogger } from 'e2b';
import { template as dockerTemplate } from './template';

Template.build(dockerTemplate, 'docker', {
  cpuCount: 2,
  memoryMB: 2048,
  onBuildLogs: defaultBuildLogger(),
});
```

## Run Containers

```typescript
// sandbox.ts
import { Sandbox } from 'e2b';

const sbx = await Sandbox.create('docker');

const result = await sbx.commands.run('sudo docker run --rm alpine echo "Hello from Alpine!"');
console.log(result.stdout);

await sbx.kill();
```

## Features

- Full Docker installation
- Ability to run containers within sandbox
- Support for Docker Compose
- Access to Docker Hub and other registries
- Persistent container state during sandbox lifetime

## Use Cases

1. Container testing
2. Multi-service application testing
3. Docker image building
4. Container orchestration testing
5. Microservices testing

## Common Commands

```bash
# List images
docker images

# Run a container
docker run --rm image-name

# Build an image
docker build -t my-image .

# Run with volume mount
docker run -v /path/in/host:/path/in/container image-name

# Run in background
docker run -d image-name

# View logs
docker logs container-id

# Stop container
docker stop container-id
```

## Performance Considerations

- Allocate sufficient CPU and memory for container workloads
- Consider nested virtualization overhead
- Monitor resource usage during container execution
- Clean up containers and images to save space

## Security Notes

- Docker runs with sudo privileges in the sandbox
- Use trusted images from official registries
- Implement proper network isolation
- Monitor container activities
