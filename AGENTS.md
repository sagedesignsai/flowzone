# Flowzone — Agent Guide

## What This Is

Flowzone is an AI-powered development platform (Next.js 16, React 19, TypeScript). Users chat with a `ToolLoopAgent` that operates in E2B cloud sandboxes to scaffold, edit, and manage full-stack applications via GitHub.

---

## Commands

| Command | What it runs |
|---------|-------------|
| `pnpm dev` | `next dev --turbopack` |
| `pnpm build` | `next build` (skips tsc errors — see below) |
| `pnpm lint` | `eslint` |
| `pnpm format` | `prettier --write "**/*.{ts,tsx}"` |
| `pnpm typecheck` | `tsc --noEmit` |

**`typecheck` is separated from `build`** — `next.config.mjs` sets `typescript.ignoreBuildErrors: true`. Run `pnpm lint && pnpm typecheck` for local validation, not `pnpm build`.

Prettier config: LF, no semicolons, double quotes, 80 print width. Tailwind classes sorted via `prettier-plugin-tailwindcss` using `cn`/`cva` as function markers.

---

## Architecture

### Route Groups

```
/                   → Landing page (public + sidebar)
/login, /signup     → Auth (redirects authenticated users to /)
/chat               → Chat list
/chat/[id]          → Active chat (resizable: chat | editor/preview/terminal)
/projects/[id]      → Project detail (authenticated)
/settings           → Profile settings (authenticated)
/templates          → Project templates (authenticated)
/brand-preview      → Brand assets preview
```

Dashboard layout (`app/(dashboard)/`) checks session server-side and redirects to `/login` if unauthenticated. Auth layout (`app/(auth)/`) redirects to `/` if already authenticated.

### Key Directories

| Path | Purpose |
|------|---------|
| `lib/agents/` | The `FlowzoneAgent` (Vercel AI SDK `ToolLoopAgent`) |
| `lib/tools/` | AI tool implementations: sandbox file I/O, sandbox git ops |
| `lib/sandbox-git.ts` | Git operations inside E2B sandboxes (clone, commit, push, diff) |
| `lib/github.ts` | GitHub App integration via Octokit (branches, PRs, repos, files) |
| `lib/auth.ts` / `lib/auth-client.ts` | BetterAuth server + client config |
| `lib/prisma.ts` | Prisma client with `@prisma/adapter-pg` (PostgreSQL) |
| `components/ai-elements/` | 48+ AI chat UI components (message, artifact, terminal, plan, etc.) |
| `components/ui/` | 55 shadcn/ui components (base-lyra style, phosphor icons) |
| `stores/` | Zustand stores (`useIdeStore`, `settings-store`, `template-store`) |
| `types/` | Shared TS types (chat, git, sandbox) |
| `trigger/tasks/` | Trigger.dev task definitions |
| `.opencode/context/` | OpenAgentsControl context files for AI agent behavior |

---

## Data Model (Prisma + PostgreSQL)

- **BetterAuth models**: `User`, `Session`, `Account`, `Verification`
- **App models**: `Project` (env vars, owns chats+git repos), `Chat` (belongs to user/project/gitRepo), `Message` (parts stored as JSON), `GitRepo`, `SandboxRun` (E2B lifecycle), `AgentRun` (Trigger.dev execution)

Schema at `prisma/schema.prisma`. Uses `prisma.config.ts` for CLI configuration. Adapter: `@prisma/adapter-pg`.

---

## AI Agent Details

- Powered by Vercel AI SDK v6 (`ai`, `@ai-sdk/*`)
- Core agent: `ToolLoopAgent` in `lib/agents/flowzone-agent.ts`
- Streaming: `createAgentUIStreamResponse` for `useChat`-compatible SSE
- Provider fallback: Anthropic Claude Sonnet → OpenAI GPT-4o → error
- Sandbox (E2B) is **optional** per-request — created only if `E2B_API_KEY` is set
- Sandbox context flows through tools via `AsyncLocalStorage` (see `lib/tools/sandbox-store.ts`)
- Tools: `runCommand`, `writeFile`, `readFile`, `listFiles` (sandbox ops); `commitAndPush`, `getDiff`, `getStatus`, `getLog` (git ops)

---

## State Management

**Zustand** for all client state. Key stores:
- `useIdeStore` — persisted to localStorage as `flowzone-ide`: view mode, chat sessions, messages, open file, terminal output, selected model
- `useSettingsStore` — profile form state (not persisted)
- `useTemplateFilter` — template category filter (not persisted)

---

## Important Gotchas

- **No tests exist** — no test directory, no test scripts in `package.json`. Any test additions must start from scratch.
- **`tsconfig.json` paths**: `@/*` maps to root (`./*`), not `./src/*`.
- **Components use `"use client"` explicitly** — RSC is the default; only add directive when hooks/browser APIs are needed.
- **Theme toggle**: Press `D` key (when not typing) toggles dark/light mode. Theme persisted via `next-themes`.
- **shadcn style**: `base-lyra` (not the default New York), icon library is `phosphor`.
- **BetterAuth** config: social providers (GitHub, Google) are **optional** (conditionally registered based on env vars). Email/password always enabled.
- **Prisma client** uses the `@prisma/adapter-pg` driver adapter (not the default Prisma query engine) — the schema omits the `url` datasource field intentionally.
- **`dotenv/config`** is imported in `lib/prisma.ts` — env vars are loaded there for scripts that don't go through Next.js.
- **`.env.example`** is the single source of truth for required env vars — ~25+ API keys across AI providers, GitHub, Slack/Discord/Telegram, Redis, E2B, etc.

---

## Conventions (from `.cursorrules`)

- Branch from `main`, use `feature/description` naming
- Never commit `.env` files; maintain `.env.example`
- pnpm for all package management
- Use Zustand for state management
- Research latest docs before implementing external library features
- Production-ready code only (no mockups/simulations)
- Modular architecture — scan for similar implementations before creating files
- Do not run `dev` or `build` unless explicitly asked

---

## Related Files

- `.cursorrules` — team conventions
- `.opencode/context/core/standards/code-quality.md` — code style standards
- `.opencode/context/project-intelligence/` — project-specific context
- `.env.example` — complete env reference
