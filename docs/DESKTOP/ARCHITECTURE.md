# Desktop System Architecture

## Overview

The virtual desktop system enables AI agents to control a full Linux GUI environment via computer-use tools (mouse, keyboard, screen capture) and autonomous coding via OpenCode CLI.

```
┌─────────────────────────────────────────────────────────────┐
│                    Flowzone Frontend                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Chat Panel → Desktop Launch → Desktop View (VNC)    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Flowzone Backend                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /api/desktop → Create sandbox + start VNC      │   │
│  │  POST /api/chat/[id]/desktop → Run desktop agent     │   │
│  │  DELETE /api/desktop → Kill sandbox                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    E2B Desktop Sandbox                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Linux GUI (XFCE4) + VNC Server                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Desktop Agent (ToolLoopAgent)                 │  │   │
│  │  │  ├─ Mouse tools (click, drag, scroll)          │  │   │
│  │  │  ├─ Keyboard tools (type, press, shortcut)     │  │   │
│  │  │  ├─ Screen tools (screenshot, size, cursor)    │  │   │
│  │  │  ├─ App tools (launch, open, window title)     │  │   │
│  │  │  ├─ Shell tool (run commands, background)      │  │   │
│  │  │  └─ OpenCode tool (delegate coding tasks)      │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Pre-installed Tools                           │  │   │
│  │  │  ├─ Node.js 22 + pnpm                          │  │   │
│  │  │  ├─ GitHub CLI                                 │  │   │
│  │  │  ├─ VS Code                                    │  │   │
│  │  │  ├─ Google Chrome                              │  │   │
│  │  │  ├─ Git (configured)                           │  │   │
│  │  │  └─ OpenCode CLI                               │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Layers

### 1. Frontend Layer

**DesktopView** (`components/editor/desktop-view.tsx`)
- Renders VNC iframe when sandbox is active
- Shows status badge and stop button
- Displays empty state when no session

**ChatPanel** (`components/chat/chat-panel.tsx`)
- Sends messages to chat API
- **Gap:** No routing to desktop agent when desktop is active

**IdeStore** (`hooks/use-ide-store.ts`)
- Stores `desktopSandboxId`, `desktopVncUrl`, `desktopStatus`
- Methods: `setDesktopSandbox()`, `clearDesktopSandbox()`, `setDesktopStatus()`

### 2. Backend Layer

**POST /api/desktop** (`app/api/desktop/route.ts`)
- Creates E2B sandbox with template `flowzone-desktop-dev`
- Starts VNC stream
- Returns `{ sandboxId, vncUrl }`
- Env vars: `E2B_API_KEY`, `E2B_DESKTOP_TIMEOUT_MS` (default 5min)

**POST /api/chat/[id]/desktop** (`app/api/chat/[id]/desktop/route.ts`)
- Connects to existing sandbox via `sandboxId`
- Runs desktop agent with validated messages
- Streams responses via SSE
- Saves chat history

**DELETE /api/desktop** (`app/api/desktop/route.ts`)
- Kills sandbox by ID
- Cleans up resources

### 3. Agent Layer

**createDesktopAgent()** (`lib/agents/desktop-agent.ts`)
- Instantiates `ToolLoopAgent` with desktop tools
- System instructions for workflow (screenshot → action → verify)
- Tools: `allDesktopTools` (18 functions)

**DesktopSandboxContext** (`lib/tools/desktop/sandbox-context.ts`)
- AsyncLocalStorage for per-request sandbox context
- Tools read sandbox via `DesktopSandboxContext.get()`
- Enables tool execution without explicit parameter passing

### 4. Tools Layer

**Desktop Tools** (`lib/tools/desktop/`)
- `mouse.ts` — 6 tools (click, right-click, double-click, scroll, move, drag)
- `keyboard.ts` — 3 tools (type, press, shortcut)
- `screen.ts` — 3 tools (screenshot, size, cursor position)
- `app.ts` — 4 tools (launch, open, window title, shell command)
- `opencode.ts` — 1 tool (run OpenCode task)
- `index.ts` — Barrel export + `allDesktopTools` object

### 5. Sandbox Template

**flowzone-desktop-ts** (`template/flowzone-desktop-ts/`)
- Base: E2B `desktop` template
- Installs: Node.js 22, pnpm, GitHub CLI, OpenCode CLI
- Configures: Git, VS Code, XFCE4 desktop, wallpaper
- Copies: `flowzone-bridge.sh` for context management

## Data Flow

### Creating a Desktop Session

```
User clicks "Launch Desktop"
    ↓
ChatPanel calls POST /api/desktop { chatId, projectId }
    ↓
Backend creates E2B Sandbox with flowzone-desktop-dev template
    ↓
Sandbox starts VNC stream
    ↓
Backend returns { sandboxId, vncUrl }
    ↓
Frontend stores in IdeStore: setDesktopSandbox(sandboxId, vncUrl)
    ↓
DesktopView renders VNC iframe with vncUrl
    ↓
User sees live desktop
```

### Sending a Message to Desktop Agent

```
User types message in ChatPanel
    ↓
ChatPanel detects desktopSandboxId is set
    ↓
Routes to POST /api/chat/[id]/desktop with { messages, sandboxId }
    ↓
Backend connects to sandbox via Sandbox.connect(sandboxId)
    ↓
Runs desktop agent with DesktopSandboxContext.run()
    ↓
Agent calls tools (mouse, keyboard, screenshot, etc.)
    ↓
Tools read sandbox from DesktopSandboxContext.get()
    ↓
Tool results streamed back to frontend
    ↓
Frontend renders tool results in chat
```

### Stopping Desktop Session

```
User clicks "Stop" button in DesktopView
    ↓
Calls DELETE /api/desktop { sandboxId }
    ↓
Backend calls desktop.kill()
    ↓
Sandbox terminates
    ↓
Frontend clears IdeStore: clearDesktopSandbox()
    ↓
DesktopView shows empty state
```

## Key Design Decisions

### AsyncLocalStorage for Context
- Tools don't need sandbox as parameter
- Cleaner tool signatures
- Per-request isolation (no cross-contamination)

### Separate Desktop Route
- `/api/chat/[id]/desktop` vs `/api/chat/[id]`
- Allows different agent, tools, and logic
- Clear separation of concerns

### VNC Streaming
- Real-time desktop visualization
- Browser-native (iframe with noVNC)
- No custom client needed

### Template-Based Provisioning
- Consistent environment across sandboxes
- Pre-installed tools (Node, pnpm, GitHub CLI, OpenCode)
- Reproducible setup

### OpenCode Integration
- Delegates complex coding to autonomous agent
- Runs inside sandbox (no network latency)
- Complements computer-use tools

## Timeout & Lifecycle

- **Default timeout:** 5 minutes (`E2B_DESKTOP_TIMEOUT_MS`)
- **Extended during agent run:** `desktop.setTimeout()` called before agent execution
- **Cleanup:** Manual via DELETE endpoint or automatic on timeout
- **Gap:** No heartbeat to detect expiration or keep alive

## Error Handling

**Current:**
- Generic error responses
- No specific handling for E2B failures

**Needed:**
- E2B API key validation
- Sandbox creation timeout handling
- VNC connection failure recovery
- Tool execution error reporting

## Performance Considerations

- **Sandbox creation:** ~10-30 seconds
- **VNC stream:** ~100ms latency
- **Tool execution:** Varies (screenshot ~500ms, click ~100ms)
- **Agent loop:** Depends on model and tool complexity

## Security

- Sandboxes are isolated per user
- E2B API key required (server-side only)
- VNC URL is temporary and sandbox-specific
- No direct shell access from frontend
- All commands go through validated tools
