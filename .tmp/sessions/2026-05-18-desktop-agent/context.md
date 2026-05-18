# Task Context: Desktop Agent Mode

Session ID: 2026-05-18-desktop-agent
Created: 2026-05-18T12:00:00Z
Status: in_progress

## Current Request
Add a Desktop Agent Mode as a clean additive layer. Separate from the existing
Flowzone code-interpreter agent — new agent, new tools, new API routes, new UI view.
NO changes to existing agent/tools/routes. Uses @e2b/desktop for VNC-streamed desktop
sandbox with computer-use tool calls. The desktop agent emulates a real developer
using OpenCode CLI for coding tasks.

## Separation of Concerns
- EXISTING (untouched): flowzone-agent, sandbox.ts, git.ts, sandbox-store.ts, /api/chat
- NEW: desktop-agent, lib/tools/desktop/*, /api/desktop/*, desktop view mode in UI

## Context Files (Standards to Follow)
- .opencode/context/core/standards/code-quality.md
- .opencode/context/core/essential-patterns.md
- .opencode/context/core/standards/security-patterns.md
- .opencode/context/core/workflows/component-planning.md

## Reference Files (Source Material)
- lib/tools/sandbox-store.ts            ← AsyncLocalStorage pattern to replicate
- lib/tools/sandbox.ts                  ← Tool definition pattern (tool(), inputSchema, execute)
- lib/tools/git.ts                      ← Tool definition pattern with requireSandbox guard
- lib/agents/flowzone-agent.ts          ← ToolLoopAgent factory pattern to replicate
- hooks/use-ide-store.ts                ← Zustand store to extend
- components/editor/editor-panel.tsx    ← AnimatePresence viewMode switch to extend
- components/editor/terminal-view.tsx   ← View component pattern
- components/editor/preview-view.tsx    ← View component pattern
- components/layout/global-header.tsx   ← VIEW_TABS array to extend
- app/api/chat/route.ts                 ← API route pattern (auth, sandbox ctx, agent)
- app/api/chat/[id]/title/route.ts      ← Nested API route pattern
- reference-repos/desktop/packages/js-sdk/src/sandbox.ts  ← E2B Desktop SDK API
- reference-repos/surf/app/api/chat/route.ts              ← Desktop sandbox lifecycle ref
- reference-repos/surf/app/actions.ts                     ← connect/kill patterns
- types/index.ts                        ← Type patterns

## Key Architectural Decisions

### Sandbox Context
- DesktopSandboxContext = separate AsyncLocalStorage<DesktopSandboxContextValue>
- DesktopSandboxContextValue = { desktop: Sandbox, sandboxId: string }
- Import from '@e2b/desktop' (NOT 'e2b' — different package, different class)

### Tool Namespacing (all files in lib/tools/desktop/)
- sandbox-context.ts  ← DesktopSandboxContext + requireDesktop guard
- mouse.ts            ← mouseLeftClick, mouseRightClick, mouseDoubleClick, mouseScroll, mouseMove, mouseDrag
- keyboard.ts         ← keyboardType, keyboardPress, keyboardShortcut
- screen.ts           ← takeScreenshot (base64 png), getScreenSize, getCursorPosition
- app.ts              ← launchApp, openFile, getWindowTitle, runShellCommand (background support)
- opencode.ts         ← runOpenCodeTask (runs 'opencode run "..."' in desktop, streams stdout)
- index.ts            ← barrel re-export of ALL desktop tools as flat object

### Desktop Agent
- lib/agents/desktop-agent.ts
- createDesktopAgent(model) returns ToolLoopAgent with ALL desktop tools
- System instructions: emulates senior dev using OpenCode CLI + visual verification loop
- Pattern: same factory pattern as createFlowzoneAgent

### API Routes
- POST /api/desktop          → create sandbox, start VNC stream, return { sandboxId, vncUrl }
- DELETE /api/desktop        → kill sandbox (body: { sandboxId })
- POST /api/desktop/[id]     → reconnect + extend timeout, return { vncUrl }
- POST /api/chat/[id]/desktop → run desktop agent on chat (separate from /api/chat)

### State Management (extend hooks/use-ide-store.ts)
- New viewMode: "desktop" added to ViewMode union
- New fields: desktopSandboxId, desktopVncUrl, desktopStatus, desktopTimeoutMs
- New actions: setDesktopSandbox, clearDesktopSandbox
- Desktop tab in VIEW_TABS only renders when desktopSandboxId is non-null

### UI
- components/editor/desktop-view.tsx  ← VNC iframe + status/controls
- editor-panel.tsx: add "desktop" case to AnimatePresence
- global-header.tsx: add Desktop tab (conditionally shown)

## E2B Desktop SDK API Reference (from sandbox.ts source)
```ts
import { Sandbox } from '@e2b/desktop'

const desktop = await Sandbox.create({ resolution: [1280, 800], dpi: 96, timeoutMs: 300000 })
desktop.sandboxId           // string
await desktop.stream.start()
desktop.stream.getUrl()     // string (noVNC URL)
await desktop.screenshot()  // Uint8Array (PNG bytes)
await desktop.leftClick(x, y)
await desktop.rightClick(x, y)
await desktop.doubleClick(x, y)
await desktop.middleClick(x, y)
await desktop.scroll('up'|'down', amount)
await desktop.moveMouse(x, y)
await desktop.mousePress('left'|'right'|'middle')
await desktop.mouseRelease('left'|'right'|'middle')
await desktop.drag([x1,y1], [x2,y2])
await desktop.write(text, { chunkSize: 25, delayInMs: 75 })
await desktop.press(key | key[])  // 'enter', 'ctrl', etc
await desktop.launch('google-chrome' | 'code' | ...)
await desktop.open(fileOrUrl)
await desktop.getCurrentWindowId()
await desktop.getApplicationWindows(appName)
await desktop.getWindowTitle(windowId)
await desktop.getCursorPosition()  // { x, y }
await desktop.getScreenSize()      // { width, height }
await desktop.commands.run(cmd, { background?, timeoutMs? })
await desktop.setTimeout(ms)
await desktop.kill()
await Sandbox.connect(sandboxId)
```

## Constraints
- Use 'inputSchema' NOT 'parameters' for tool() definitions (matches existing codebase)
- Use zod v4 syntax (z.object, z.string().describe(), etc.)
- No semicolons, double quotes, 80 print width (Prettier config)
- All new files must follow the existing tool comment header pattern
- Dynamic import of '@e2b/desktop' (same as existing 'e2b' dynamic import pattern)
- takeScreenshot returns base64 string (Buffer.from(bytes).toString('base64'))
- runOpenCodeTask: run `opencode run "<prompt>"` — capture stdout/stderr/exitCode
- Desktop tab: only show in VIEW_TABS when desktopSandboxId !== null
- viewMode type lives in hooks/use-ide-store.ts — update ViewMode union there

## Package to Install
pnpm add @e2b/desktop@^2.2.3

## New Env Var
E2B_DESKTOP_TIMEOUT_MS=300000   (in .env.example)

## Exit Criteria
- [ ] lib/tools/desktop/sandbox-context.ts implemented
- [ ] lib/tools/desktop/mouse.ts implemented (6 tools)
- [ ] lib/tools/desktop/keyboard.ts implemented (3 tools)
- [ ] lib/tools/desktop/screen.ts implemented (3 tools)
- [ ] lib/tools/desktop/app.ts implemented (4 tools)
- [ ] lib/tools/desktop/opencode.ts implemented (1 tool)
- [ ] lib/tools/desktop/index.ts barrel export
- [ ] lib/agents/desktop-agent.ts implemented
- [ ] app/api/desktop/route.ts implemented (POST + DELETE)
- [ ] app/api/desktop/[id]/route.ts implemented (POST reconnect)
- [ ] app/api/chat/[id]/desktop/route.ts implemented
- [ ] hooks/use-ide-store.ts extended (viewMode + desktop state)
- [ ] components/editor/desktop-view.tsx implemented
- [ ] components/editor/editor-panel.tsx updated (desktop case)
- [ ] components/layout/global-header.tsx updated (conditional Desktop tab)
- [ ] @e2b/desktop installed
- [ ] .env.example updated
