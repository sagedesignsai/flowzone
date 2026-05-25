# Examples: Claude Code

## Overview
Claude Code Agent available in a sandbox environment.

## Template Definition

```typescript
// template.ts
import { Template } from 'e2b';

export const template = Template()
  .fromNodeImage('24')
  .aptInstall(['curl', 'git', 'ripgrep'])
  // Claude Code will be available globally as "claude"
  .npmInstall('@anthropic-ai/claude-code@latest', { g: true });
```

## Build Script

```typescript
// build.ts
import { Template, defaultBuildLogger } from 'e2b';
import { template as claudeCodeTemplate } from './template';

Template.build(claudeCodeTemplate, 'claude-code', {
  cpuCount: 1,
  memoryMB: 1024,
  onBuildLogs: defaultBuildLogger(),
});
```

## Sandbox Usage

```typescript
// sandbox.ts
import { Sandbox } from 'e2b';

const sbx = await Sandbox.create('claude-code', {
  envs: {
    ANTHROPIC_API_KEY: '', // Set your API key
  },
});

console.log('Sandbox created', sbx.sandboxId);

// Print help for Claude Code
// const result = await sbx.commands.run('claude --help');
// console.log(result.stdout);

// Run a prompt with Claude Code
const result = await sbx.commands.run(
  `echo 'Create a hello world index.html' | claude -p --dangerously-skip-permissions`,
  { timeoutMs: 0 }
);

console.log(result.stdout);

sbx.kill();
```

## Features

- Claude Code agent available globally as `claude` command
- Supports code generation and execution
- Requires ANTHROPIC_API_KEY environment variable
- Can be used for automated code generation tasks

## Requirements

- Node.js 24 or compatible version
- curl, git, and ripgrep installed
- Anthropic API key for Claude Code functionality
- Sufficient memory allocation (1GB minimum)

## Use Cases

1. Automated code generation
2. Code analysis and refactoring
3. Documentation generation
4. Test generation
5. Code review automation
