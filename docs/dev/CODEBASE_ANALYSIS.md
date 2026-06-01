# Flowzone Codebase Analysis

## Current State

### Architecture
- **Framework:** Next.js 16 with React 19, TypeScript
- **State Management:** Zustand (client-side)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** BetterAuth with GitHub/Google OAuth
- **UI Components:** shadcn/ui (base-lyra style) + 55+ custom components
- **Icons:** Phosphor icons
- **Styling:** Tailwind CSS with custom theme

### Key Directories
```
app/                    → Next.js routes (app router)
├── (dashboard)/        → Authenticated routes
├── (auth)/             → Login/signup
├── api/                → API endpoints
└── chat/[id]/          → Chat workspace

components/
├── ui/                 → 55+ shadcn/ui components
├── ai-elements/        → 48+ AI chat UI components
├── layout/             → App layout, header, sidebar
├── chat/               → Chat panel
├── editor/             → Editor views (code, preview, terminal, desktop)
├── settings/           → Settings components (minimal)
└── ...

lib/
├── agents/             → AI agent (Vercel AI SDK)
├── tools/              → Sandbox tools, git operations
├── auth.ts             → BetterAuth config
├── github.ts           → GitHub API integration
├── prisma.ts           → Prisma client
└── ...

stores/
├── use-ide-store.ts    → IDE state (view mode, chat sessions, etc.)
├── settings-store.ts   → Settings form state (minimal)
└── template-store.ts   → Template filtering

types/
└── index.ts            → Shared TypeScript types

prisma/
└── schema.prisma       → Database schema
```

### Database Models
- **User** — BetterAuth user
- **Session** — BetterAuth session
- **Account** — OAuth accounts
- **Verification** — Email verification
- **Project** — User project with env vars
- **Chat** — Chat conversation
- **GitRepo** — Git repository reference
- **SandboxRun** — E2B sandbox lifecycle
- **AgentRun** — Trigger.dev execution

### Existing Features
✅ Chat interface with AI agent
✅ Code editor (Monaco)
✅ Preview/Terminal/Desktop views
✅ GitHub integration (OAuth, repos, branches, PRs)
✅ E2B sandbox integration
✅ File uploads/attachments
✅ Dark/light theme toggle
✅ User authentication
✅ Project management
✅ Template system

### Current Limitations
❌ Settings dialog is minimal (only profile form)
❌ User dropdown lacks preferences/theme section
❌ No View Branch dropdown
❌ No file tree in editor
❌ No editor tabs
❌ Limited integration settings (GitHub only)
❌ No environment variables UI
❌ No custom domains UI
❌ No analytics configuration

---

## Code Quality Assessment

### Strengths
✅ **Modular Architecture** — Clear separation of concerns
✅ **Type Safety** — Full TypeScript coverage
✅ **Component Reusability** — Well-organized UI components
✅ **State Management** — Consistent Zustand usage
✅ **API Structure** — RESTful endpoints with proper error handling
✅ **Code Style** — Consistent formatting (Prettier, ESLint)
✅ **Documentation** — AGENTS.md provides good context

### Areas for Improvement
⚠️ **Settings Store** — Too minimal, needs expansion
⚠️ **Settings Page** — Placeholder content ("More preferences coming soon")
⚠️ **Dead Code** — Old settings page can be replaced with modal
⚠️ **API Coverage** — Missing endpoints for new features
⚠️ **Error Handling** — Some APIs lack comprehensive error handling
⚠️ **Validation** — Input validation could be more robust

---

## Dead Code to Remove

1. **`app/(dashboard)/settings/page.tsx`** — Will be replaced by settings dialog
2. **`components/settings/profile-form.tsx`** — Merge into settings dialog
3. **`components/settings/settings-section.tsx`** — Reusable but can be simplified
4. **Unused placeholder text** — "More preferences coming soon"

---

## Integration Points

### Existing Stores to Enhance
- **`useIdeStore`** — Add file tree + tabs state
- **`useSettingsStore`** — Expand for all settings sections

### Existing APIs to Extend
- **`/api/user`** — Already handles profile updates
- **`/api/github/*`** — Already handles GitHub integration
- **`/api/chat/*`** — Already handles chat operations

### Existing Components to Update
- **`GlobalHeader`** — Add new dropdowns
- **`EditorPanel`** — Add file tree + tabs
- **`AppLayout`** — No changes needed

---

## Implementation Strategy

### Phase 1: Foundation (Stores + Types)
- Enhance `useSettingsStore` with all settings sections
- Create `useEditorStore` for file tree + tabs
- Define TypeScript types for all new features

### Phase 2: Components (UI)
- Settings dialog with sidebar
- 6 settings sections
- Enhanced user dropdown
- View branch dropdown
- File tree
- Editor tabs

### Phase 3: APIs (Backend)
- Settings endpoints (GET/POST)
- GitHub integration endpoint
- Integrations endpoints
- Environment variables endpoints
- Git operations endpoints
- Editor file tree endpoint

### Phase 4: Integration (Wiring)
- Connect components to stores
- Connect stores to APIs
- Update GlobalHeader
- Update EditorPanel
- Test all flows

### Phase 5: Cleanup
- Remove dead code
- Update documentation
- Final testing

---

## Technology Stack Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + TypeScript | Latest React with hooks |
| Framework | Next.js 16 | App router, SSR/SSG |
| State | Zustand | Client-side state management |
| UI | shadcn/ui + Tailwind | base-lyra style, Phosphor icons |
| Database | PostgreSQL + Prisma | Type-safe ORM |
| Auth | BetterAuth | OAuth + email/password |
| AI | Vercel AI SDK | Streaming, tool calling |
| Sandbox | E2B | Cloud development environment |
| Git | Octokit + custom | GitHub API + git operations |

---

## Key Conventions

From `.cursorrules`:
- Branch naming: `feature/description`
- Package manager: `pnpm`
- State management: Zustand
- Code style: Prettier (LF, no semicolons, 80 print width)
- Components: Use `"use client"` only when needed
- Production-ready code only (no mockups/simulations)

---

## Next Steps

1. ✅ **Analysis Complete** — Codebase understood
2. ⏳ **Planning Complete** — Implementation plan documented
3. 🔄 **Ready for Implementation** — Start Phase 1 (Stores + Types)

See `IMPLEMENTATION_PLAN.md` for detailed specifications.
