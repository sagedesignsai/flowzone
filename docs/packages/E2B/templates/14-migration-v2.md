# V2 Migration Guide

## Overview
How to migrate from legacy template definition to the new E2B template format.

## Migration Options

E2B provides three ways to migrate existing templates:

1. **Migration command** (recommended)
2. **fromDockerfile() method** for existing Dockerfiles
3. **fromImage() method** for pre-built Docker images

## Important Note

The default user for templates is `user` with working directory `/home/user`. This differs from Docker defaults where the user is `root` with `/` as workdir.

## Migration Command (Recommended)

### Step 1: Install E2B CLI

Install the latest version of the E2B CLI.

### Step 2: Navigate to Template Folder

Navigate to the folder containing your existing template definition (where `e2b.toml` and `e2b.Dockerfile` files are located).

### Step 3: Run Migration Command

```bash
e2b template migrate
```

Your existing `e2b.toml` and `e2b.Dockerfile` files will be renamed to `e2b.toml.old` and `e2b.Dockerfile.old` respectively, as they are no longer required.

### Step 4: Follow Prompts

Follow the prompts to complete the migration process.

### Step 5: Generated Output

The migration command generates three files (based on selected language):

```
template.ts - Template definition using the SDK
build.dev.ts - Development build script
build.prod.ts - Production build script
```

## Using fromDockerfile() Method

If you want to keep using Dockerfile for your template, use the `fromDockerfile()` method. E2B automatically parses the Dockerfile and builds the template based on it.

```typescript
// template.ts
import { Template } from 'e2b';

const template = Template()
  .fromDockerfile(dockerfileContent);
```

### Supported Dockerfile Instructions

Only a limited set of instructions are supported and converted:

- `FROM` - Sets base image
- `RUN` - Converts to `runCmd()`
- `COPY` - Converts to `copy()`
- `ADD` - Converts to `copy()`
- `WORKDIR` - Converts to `setWorkdir()`
- `USER` - Converts to `setUser()`
- `ENV` - Converts to `setEnvs()`
- `CMD` - Converts to `setStartCmd()`
- `ENTRYPOINT` - Converts to `setStartCmd()`

After template definition, create build scripts as described in the Quickstart section.

## Using fromImage() Method

If you already have a Docker image built, or prefer to build Docker images yourself, use the `fromImage()` method.

```typescript
// template.ts
import { Template } from 'e2b';

const template = Template()
  .fromImage("image-tag");
```

### Steps

1. Build Docker image for `linux/amd64` platform
2. Push image to registry of your choice
3. Reference image tag in `fromImage()` method
4. Specify credentials for private registries if needed (see Base Image documentation)

## Migration Checklist

- [ ] Install E2B CLI
- [ ] Navigate to template folder
- [ ] Run migration command
- [ ] Review generated files
- [ ] Test new template definition
- [ ] Update build scripts if needed
- [ ] Deploy new template
- [ ] Archive old template files

## Key Differences

| Aspect | Old Format | New Format |
| --- | --- | --- |
| Definition | `e2b.toml` + `e2b.Dockerfile` | `template.ts` |
| Language | TOML + Dockerfile | TypeScript |
| Build Scripts | Manual | Generated |
| API | CLI-based | SDK-based |
| Flexibility | Limited | Extensive |

## Post-Migration

1. Test the migrated template thoroughly
2. Update CI/CD pipelines if needed
3. Update documentation
4. Train team on new format
5. Archive old template files

## Troubleshooting

- **Migration fails**: Ensure you're in the correct directory
- **Build errors**: Review generated template for syntax errors
- **Dockerfile parsing issues**: Use `fromImage()` method instead
- **Permission errors**: Check file permissions and ownership

## Support

For migration issues, refer to:
- E2B documentation
- GitHub issues
- Community forums
