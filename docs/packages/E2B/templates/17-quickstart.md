# Quickstart

## Overview
Get started with E2B templates quickly using either the CLI or SDK.

## Two Ways to Start

1. **Using the CLI** (recommended for beginners)
2. **Manually using the SDK** (for advanced users)

## CLI Method

### Step 1: Install the E2B CLI

Install the latest version of the E2B CLI.

### Step 2: Initialize a New Template

```bash
e2b template init
```

### Step 3: Follow the Prompts

Follow the prompts to create a new template.

### Step 4: Done

Check the generated `README.md` file to see how to build and use your new template.

## Manual Method

### Step 1: Install the Packages

Requires E2B SDK version at least 2.3.0

```bash
npm install e2b dotenv
```

### Step 2: Create the .env File

```
E2B_API_KEY=e2b_***
```

### Step 3: Create a New Template File

Create a template file with the following name and content:

```typescript
// template.ts
import { Template, waitForTimeout } from 'e2b';

export const template = Template()
  .fromBaseImage()
  .setEnvs({
    HELLO: "Hello, World!",
  })
  .setStartCmd("echo $HELLO", waitForTimeout(5_000));
```

### Step 4: Create a Development Build Script

```typescript
// build.dev.ts
import 'dotenv/config';
import { Template, defaultBuildLogger } from 'e2b';
import { template } from './template';

async function main() {
  await Template.build(template, 'template-tag-dev', {
    cpuCount: 1,
    memoryMB: 1024,
    onBuildLogs: defaultBuildLogger(),
  });
}

main().catch(console.error);
```

### Step 5: Create a Production Build Script

```typescript
// build.prod.ts
import 'dotenv/config';
import { Template, defaultBuildLogger } from 'e2b';
import { template } from './template';

async function main() {
  await Template.build(template, 'template-tag', {
    cpuCount: 1,
    memoryMB: 1024,
    onBuildLogs: defaultBuildLogger(),
  });
}

main().catch(console.error);
```

### Step 6: Build the Template

Build the development template:

```bash
npx tsx build.dev.ts
```

Build the production template:

```bash
npx tsx build.prod.ts
```

## Create a New Sandbox from the Template

```typescript
import 'dotenv/config';
import { Sandbox } from 'e2b';

// Create a Sandbox from development template
const sandbox = await Sandbox.create("template-tag-dev");

// Create a Sandbox from production template
const sandbox = await Sandbox.create("template-tag");
```

## Template Name

The template name is the identifier that can be used to create a new Sandbox.

## Project Structure

After setup, your project should look like:

```
project/
├── template.ts
├── build.dev.ts
├── build.prod.ts
├── .env
├── package.json
└── tsconfig.json
```

## Next Steps

1. Customize your template definition
2. Add dependencies and tools
3. Configure start and ready commands
4. Test your template
5. Deploy to production

## Common Customizations

### Add System Packages

```typescript
template.aptInstall(['curl', 'wget', 'git']);
```

### Install Node.js Packages

```typescript
template.npmInstall(['express', 'lodash']);
```

### Copy Files

```typescript
template.copy('config.json', '/app/config.json');
```

### Run Commands

```typescript
template.runCmd('npm install');
```

### Set Environment Variables

```typescript
template.setEnvs({
  NODE_ENV: 'production',
  API_KEY: 'your-key',
});
```

## Troubleshooting

- **Build fails**: Check logs with `defaultBuildLogger()`
- **Template not found**: Verify template name matches
- **Sandbox creation fails**: Ensure template is built successfully
- **API key error**: Check `.env` file and E2B_API_KEY value

## Resources

- E2B Documentation
- SDK Reference
- GitHub Examples
- Community Forums
