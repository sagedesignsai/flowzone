# AGENTS.md - Flowzone

## Core Stack
- **Framework**: Next.js 16.1.7 (App Router) with Turbopack
- **UI**: React 19, Tailwind CSS 4, shadcn/ui, `@base-ui/react`
- **Language**: TypeScript 5.9+ (strict mode)
- **State**: Zustand (required - no other state management libraries)
- **ORM**: Prisma 7.x + PostgreSQL
- **Auth**: BetterAuth
- **AI**: Vercel AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `@ai-sdk/openai`)
- **Sandboxes**: E2B (code-interpreter + desktop)
- **Background Jobs**: Trigger.dev

## Developer Commands

```bash
pnpm dev        # next dev --turbopack
pnpm build      # next build
pnpm start      # next start
pnpm lint       # eslint (no args needed - it defaults correctly)
pnpm typecheck  # tsc --noEmit
pnpm format     # prettier --write ts/tsx files
```

**Important**: Use `pnpm` exclusively - per team convention.

## Package Manager & Workflows
- **Package manager**: pnpm
- **Primary branch**: `main`
- **Workflow**: Feature branching (`feature/description`) + PRs to `main`
- **Never commit**: `.env`, secrets, or mock/simulation code

## Architecture & Directories

```
app/                    # Next.js App Router (route groups: (auth), (dashboard))
├── api/               # API routes
├── chat/              # Chat interface (agent conversations)
├── (auth)/            # Login/signup pages
└── (dashboard)/       # Authenticated dashboard (projects, settings, templates)

components/
├── ui/                # shadcn/ui components
├── auth/              # Auth components (login, signup, social)
└── complex/           # Complex/composed components

lib/
├── agents/            # Agent implementations (flowzone-agent, desktop-agent)
├── chat/              # Chat logic (handlers, store, sandbox)
├── tools/             # AI tool implementations
│   ├── sandbox.ts     # E2B code interpreter
│   ├── github.ts      # GitHub operations
│   └── desktop/       # Desktop sandbox tools (mouse, keyboard, screen)
├── github/            # GitHub App integration (webhooks, API wrappers)
├── opencode-sandbox/  # OpenCode sandbox orchestration
├── ai/                # AI model config
├── auth.ts            # BetterAuth server
├── prisma.ts          # Prisma client
└── utils.ts           # Shared utilities (cn, etc.)

prisma/schema.prisma   # Database schema
```

## Key Integrations

### AI Agents
- Entry points: `lib/agents/flowzone-agent.ts` (main), `lib/agents/desktop-agent.ts` (E2B desktop)
- Chat handlers: `lib/chat/handlers/`

### E2B Sandboxes
- Code Interpreter: `lib/tools/sandbox.ts`
- Desktop Sandbox: `lib/tools/desktop/` (mouse, keyboard, screen, git operations)
- Template: `E2B_DESKTOP_TEMPLATE="flowzone-desktop-dev"`

### GitHub App
- Webhooks: `lib/github/webhooks/` (push, PR, installation)
- API wrappers: `lib/github/*.ts` (pulls, issues, releases, etc.)
- Models: `GitRepo`, `Chat.gitBranch`, `Chat.gitRepoId`

### Prisma Models
- User/Session/Account/Verification (BetterAuth)
- Project, Chat, Message, GitRepo, SandboxRun, AgentRun (Flowzone core)
- Post (quickstart example)

## Code Style Conventions

### Prettier (non-default)
- **Semi**: `false` (no semicolons)
- **SingleQuote**: `false` (use double quotes)
- **Trailing comma**: `es5`
- **Tailwind plugin**: enabled with `cn()` and `cva()` functions
- Print width: 80

### Imports
- Path alias: `@/*` → `/*` (from tsconfig.json baseUrl + paths)

## Important Quirks

### Next.js Config
- `typescript.ignoreBuildErrors: true` - build passes despite TS errors
- `devIndicators: false` - no floating dev indicator

### Prisma
- `postinstall` runs `prisma generate` automatically after `pnpm install`
- When modifying schema: run `pnpm prisma db push` or `migrate dev`

### Environment
- Copy `.env.example` → `.env` for required variables
- Services needed: PostgreSQL, optional Redis (chat state)

## Testing
- No test framework configured yet
- Check for test patterns in `package.json` scripts

## When to Research First
- Before implementing: consult `.cursorrules` #10-11 - research latest library docs
- shadcn/ui: `npx shadcn@latest add <component>` adds to `components/ui/`
- Import shadcn components as: `import { X } from "@/components/ui/x"`
