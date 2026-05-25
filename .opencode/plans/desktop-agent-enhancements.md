# Desktop Agent Enhancements Plan

## Vision

The DesktopAgent operates a full development loop inside an E2B desktop sandbox:
1. **Code** via OpenCode TUI (driven by Server API, keyboard as fallback)
2. **Build** via shell commands (pnpm install, build)
3. **Run** via dev servers in background
4. **Verify** via browser preview + screenshots

The OpenCode TUI is **visible in the VNC stream** — you see it work in real-time.

---

## Architecture

```
Flowzone Chat ──→ /api/chat ──→ DesktopAgent (Vercel ToolLoopAgent)
                                     │
                                     │ connects to E2B desktop sandbox
                                     ▼
                                 E2B Desktop
                                     │
                          ┌──────────┼──────────┐
                          │          │          │
                          ▼          ▼          ▼
                    opencode ──→ Server API ──→ Bridge Plugin
                    --port 4096  POST /tui/     subscribes to:
                    (TUI visible  append-prompt  session.created
                     in VNC)      submit-prompt   session.idle
                                  GET /session    session.error
                                                 shell.env
                                                 flowzone_push tool
                                     │
                                     ▼
                                POST /api/opencode/*
```

## End-to-End Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | User | Types message in Flowzone chat |
| 2 | `/api/chat/route.ts` | Detects `application/x-desktop-sandbox` attachment → routes to DesktopAgent |
| 3 | DesktopAgent | Connects to E2B desktop via `Sandbox.connect(sandboxId)` |
| 4 | DesktopAgent | Checks if OpenCode is running (`GET /global/health`). If not: open terminal → `opencode --port 4096` |
| 5 | DesktopAgent | Submits user's prompt via Server API: `POST /tui/append-prompt` → `POST /tui/submit-prompt` |
| 6 | OpenCode | Processes prompt. Plugin bridges events back to Flowzone. TUI visible in VNC. |
| 7 | DesktopAgent | Screenshots to monitor progress. Polls messages via `GET /session/:id/message`. |
| 8 | DesktopAgent | Runs `pnpm install`, starts dev server (`pnpm dev`), opens browser, screenshots to verify. |
| 9 | DesktopAgent | Sends result back to user via streaming chat response. |
| 10 | User | Sends follow-up → continues same OpenCode session via `/tui/submit-prompt`. |

## Decisions

| Question | Decision |
|----------|----------|
| Server API vs Keyboard | **Hybrid** — prefer Server API (fast, low token cost), fall back to keyboard if unavailable |
| TUI visible? | **Yes** — `opencode --port 4096` so TUI shows in VNC stream |
| Continue session? | **Yes** — same OpenCode session across turns for context continuity |
| Dev server + browser? | **Auto** — after code changes, always start dev server + open browser preview |
| `runOpenCodeTask` | **Keep as fallback** — for batch operations where visible TUI isn't needed |
| Plugin SDK import | **`@opencode-ai/plugin`** — OpenCode bundles it; plugin is `.ts` source copied during template build |

## Files

### Modified (6)

| File | Change |
|------|--------|
| `app/api/chat/route.ts` | Detect desktop attachment → route to DesktopAgent (Sandbox.connect + DesktopSandboxContext) |
| `lib/agents/desktop-agent.ts` | System prompt: Server API workflow, dev loop, browser preview, visual verification |
| `hooks/use-ide-store.ts` | Add `desktopSandboxId`, `desktopVncUrl`, `desktopStatus` to `partialize` |
| `components/editor/desktop-view.tsx` | Remove unmount kill; add reconnect on mount; reconnect loading state |
| `app/api/desktop/route.ts` | Read `E2B_DESKTOP_TEMPLATE` from env |
| `template/flowzone-desktop/files/opencode-config.json` | Widen file permissions (ephemeral sandbox) |

### New (5)

| File | Purpose |
|------|---------|
| `app/api/opencode/status/route.ts` | POST endpoint for session lifecycle bridge |
| `app/api/opencode/error/route.ts` | POST endpoint for error bridge |
| `app/api/opencode/pr/route.ts` | POST endpoint for PR creation bridge |
| `template/flowzone-desktop/files/opencode-plugins/flowzone-bridge.ts` | OpenCode plugin: events, shell.env, flowzone_push tool |
| `.opencode/plans/desktop-agent-enhancements.md` | This plan file |

### Template updates

| File | Change |
|------|--------|
| `template/flowzone-desktop/template.py` | Add `.make_dir("plugins")` + CopyItem for plugin file |
| `template/flowzone-desktop-ts/template.ts` | Same |

## Prerequisite

**Build & publish template**: `poetry run python build_prod.py` from `template/flowzone-desktop/` → publishes `flowzone-desktop` to E2B. Required before any `Sandbox.create("flowzone-desktop", ...)` will work.

## Verification

1. **Routing**: Start desktop → send message → verify `/api/chat` routes to `createDesktopAgent` (not `createFlowzoneAgent`)
2. **Server API**: Agent should curl `localhost:4096/tui/append-prompt` + `/tui/submit-prompt` instead of typing
3. **TUI visible**: VNC stream shows OpenCode TUI processing the prompt
4. **Dev loop**: After code → `pnpm install` → `pnpm dev` → Chrome open + screenshot
5. **Persistence**: Reload page → desktopSandboxId persists → reconnect fires → VNC returns
6. **Cleanup**: Only stops on explicit "Stop" button, not on navigation
7. **Plugin events**: OpenCode session events → POST to `/api/opencode/status`
