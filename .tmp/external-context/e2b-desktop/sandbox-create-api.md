---
source: GitHub Source + E2B Official Docs
library: e2b-desktop
package: "@e2b/desktop"
topic: Sandbox.create API signature, envs, metadata
fetched: 2026-05-18T00:00:00Z
official_docs: https://e2b.dev/docs
---

# @e2b/desktop — Sandbox.create() API Reference (v2.2.2)

## Package

```
npm install @e2b/desktop
```

Current version: **2.2.2** (published ~5 months ago as of May 2026)

---

## Sandbox.create() — Exact Signatures

The `@e2b/desktop` `Sandbox` class extends the base `e2b.Sandbox` and adds desktop-specific options. There are **two overloads**:

### Overload 1: Create from default template (`'desktop'`)

```ts
static async create<S extends typeof Sandbox>(
  this: S,
  opts?: SandboxOpts
): Promise<InstanceType<S>>
```

### Overload 2: Create from a specific template

```ts
static async create<S extends typeof Sandbox>(
  this: S,
  template: string,       // template name or ID — FIRST positional argument
  opts?: SandboxOpts
): Promise<InstanceType<S>>
```

### Internal Implementation (how it resolves args)

```ts
static async create<S extends typeof Sandbox>(
  this: S,
  templateOrOpts?: SandboxOpts | string,
  opts?: SandboxOpts
): Promise<InstanceType<S>> {
  const { template, sandboxOpts } =
    typeof templateOrOpts === 'string'
      ? { template: templateOrOpts, sandboxOpts: opts }
      : { template: this.defaultTemplate, sandboxOpts: templateOrOpts }

  // DISPLAY env is auto-injected if not already set
  const display = opts?.display || ':0'
  const sandboxOptsWithDisplay = {
    ...sandboxOpts,
    envs: {
      ...sandboxOpts?.envs,
      DISPLAY: display,
    },
  }

  const sbx = (await super.create(template, sandboxOptsWithDisplay)) as InstanceType<S>
  await sbx._start(display, sandboxOptsWithDisplay)
  return sbx
}
```

Key: `defaultTemplate = 'desktop'`. If first arg is a string, it's the template. If it's an object (or omitted), the default `'desktop'` template is used.

---

## SandboxOpts Interface (Complete)

`SandboxOpts` extends the base `e2b.SandboxOpts` from the `e2b` package:

```ts
// From @e2b/desktop — desktop-specific additions
export interface SandboxOpts extends SandboxOptsBase {
  resolution?: [number, number]   // Screen resolution [width, height]. Default: [1024, 768]
  dpi?: number                    // Display DPI. Default: 96
  display?: string                // X11 display identifier. Default: ":0"
}

// From base e2b package — inherited fields
interface SandboxOptsBase {
  timeoutMs?: number              // Sandbox lifetime in MILLISECONDS. Default: 300_000 (5 min)
                                  // Max: 86_400_000 (24h) for Pro, 3_600_000 (1h) for Hobby
  metadata?: Record<string, string>  // Custom metadata for the sandbox. Default: {}
  envs?: Record<string, string>      // Custom environment variables. Default: {}
  apiKey?: string                    // E2B API key. Default: E2B_API_KEY env var
  accessToken?: string               // E2B access token. Default: E2B_ACCESS_TOKEN env var
  domain?: string                    // API domain. Default: E2B_DOMAIN or "e2b.app"
  debug?: boolean                    // Debug mode. Default: false
  secure?: boolean                   // Secure sandbox controller with auth token. Default: false
  allowInternetAccess?: boolean      // Allow internet access. Default: true
  requestTimeoutMs?: number          // API request timeout. Default: 60_000
  logger?: Logger                    // Logger instance
  headers?: Record<string, string>   // Additional request headers
}
```

---

## How to Pass `envs` (Environment Variables)

```ts
import { Sandbox } from '@e2b/desktop'

const sandbox = await Sandbox.create({
  envs: {
    FLOWZONE_API_URL: 'https://api.flowzone.app',
    GITHUB_TOKEN: 'ghp_xxx...',
    ANTHROPIC_API_KEY: 'sk-ant-xxx...',
    OPENAI_API_KEY: 'sk-proj-xxx...',
    // Any other env vars your sandboxed app needs
  },
})
```

**Important**: The `DISPLAY` environment variable is **automatically injected** by `@e2b/desktop`. If you don't set `display` in opts, it defaults to `:0`. Your `envs` are merged with `{ DISPLAY: ':0' }` — your custom envs take precedence if you explicitly set `DISPLAY`.

---

## How to Pass `metadata`

```ts
import { Sandbox } from '@e2b/desktop'

const sandbox = await Sandbox.create({
  metadata: {
    userId: 'user_abc123',
    projectId: 'proj_xyz789',
    chatId: 'chat_def456',
  },
})
```

Metadata is `Record<string, string>` — both keys and values must be strings. You can query sandboxes by metadata later using `Sandbox.list({ query: { metadata: { userId: 'user_abc123' } } })`.

---

## How to Pass a Template ID as First Argument

```ts
import { Sandbox } from '@e2b/desktop'

// Using a custom template ID
const sandbox = await Sandbox.create('your-template-id-or-name', {
  envs: {
    FLOWZONE_API_URL: 'https://api.flowzone.app',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
  },
  metadata: {
    userId: 'user_abc123',
    projectId: 'proj_xyz789',
    chatId: 'chat_def456',
  },
  timeoutMs: 600_000,        // 10 minutes
  resolution: [1920, 1080],  // Full HD
  dpi: 96,
})
```

---

## Complete Example for Flowzone Use Case

```ts
import { Sandbox } from '@e2b/desktop'

async function createFlowzoneSandbox(params: {
  userId: string
  projectId: string
  chatId: string
  templateId?: string
  timeoutMs?: number
}) {
  const sandbox = await Sandbox.create(
    params.templateId ?? 'desktop',  // or omit for default
    {
      envs: {
        FLOWZONE_API_URL: process.env.FLOWZONE_API_URL!,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
        E2B_API_KEY: process.env.E2B_API_KEY!,
      },
      metadata: {
        userId: params.userId,
        projectId: params.projectId,
        chatId: params.chatId,
      },
      timeoutMs: params.timeoutMs ?? 300_000,  // 5 min default
      resolution: [1280, 800],
      dpi: 96,
      allowInternetAccess: true,
    }
  )

  // Start VNC stream for viewing
  await sandbox.stream.start({ requireAuth: true })
  const streamUrl = sandbox.stream.getUrl({
    authKey: sandbox.stream.getAuthKey(),
  })

  console.log('Sandbox ID:', sandbox.sandboxId)
  console.log('Stream URL:', streamUrl)

  return sandbox
}
```

---

## Key Notes

1. **`timeoutMs` is in MILLISECONDS** (not seconds like Python SDK). Default: `300_000` (5 minutes).
2. **`envs` are used when executing commands** in the sandbox. They can be overridden per-command.
3. **`DISPLAY` is auto-injected** — you don't need to set it manually unless you want a different display.
4. **`metadata` values must be strings** — no numbers, booleans, or objects.
5. **Template ID can be a name or UUID** — both work as the first argument.
6. **Default template is `'desktop'`** — the pre-built Ubuntu + XFCE desktop image.
7. **Max lifetime**: 24 hours (Pro) / 1 hour (Hobby tier).
