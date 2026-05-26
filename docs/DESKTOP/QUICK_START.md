# Desktop Integration Quick Start

Get the E2B Desktop system running in 5 minutes.

## Prerequisites

1. **E2B API Key** — Get from [e2b.dev](https://e2b.dev)
2. **Environment Variable** — Set `E2B_API_KEY` in `.env.local`

```bash
# .env.local
E2B_API_KEY=your_key_here
```

## Start Using Desktop

### 1. Open a Chat
Navigate to any chat in Flowzone.

### 2. Click "Launch Desktop"
Button appears in the prompt input footer (next to attachments).

```
[Attachments] [Launch Desktop] [Send]
```

### 3. Wait for VNC to Load
- Shows "Starting..." while creating sandbox
- VNC iframe loads when ready
- View switches to desktop automatically

### 4. Send Messages
Type a message and send. It automatically routes to the desktop agent.

```
User: "Take a screenshot"
Agent: [Takes screenshot, displays in chat]

User: "Open Chrome and go to localhost:3000"
Agent: [Launches Chrome, navigates, shows screenshot]
```

### 5. See Results
- Screenshots display in chat
- Tool outputs show below messages
- Desktop view shows live VNC stream

### 6. Stop Desktop
Click "Stop" button in desktop header to terminate sandbox.

---

## Common Tasks

### Build a React App
```
User: "Create a React app with npm"
Agent: 
  1. Takes screenshot (sees desktop)
  2. Launches terminal
  3. Runs: npx create-react-app my-app
  4. Starts dev server
  5. Opens in Chrome
  6. Shows screenshot of running app
```

### Debug Code
```
User: "Run tests and fix any failures"
Agent:
  1. Takes screenshot
  2. Opens VS Code
  3. Runs: npm test
  4. Sees failing tests
  5. Uses OpenCode to fix
  6. Runs tests again
  7. Shows passing tests
```

### Deploy to GitHub
```
User: "Push my changes to GitHub"
Agent:
  1. Takes screenshot
  2. Opens terminal
  3. Runs: git add .
  4. Runs: git commit -m "Update"
  5. Runs: git push
  6. Shows success
```

---

## What Happens Behind the Scenes

### Desktop Launch
```
Click "Launch Desktop"
  ↓
POST /api/desktop { chatId, projectId }
  ↓
E2B creates sandbox with flowzone-desktop-dev template
  ↓
VNC stream starts
  ↓
Returns { sandboxId, vncUrl }
  ↓
Store in browser state
  ↓
Render VNC iframe
```

### Message Routing
```
User sends message
  ↓
ChatPanel detects desktopSandboxId
  ↓
Routes to POST /api/chat/[id]/desktop
  ↓
Passes { messages, sandboxId }
  ↓
Desktop agent runs with tools
  ↓
Tools execute in sandbox
  ↓
Results stream back
  ↓
Display in chat
```

### Monitoring
```
Every 30 seconds:
  ↓
GET /api/desktop/[id]/status
  ↓
If 404 → Sandbox expired
  ↓
Auto-cleanup
  ↓
Show notification
```

---

## Troubleshooting

### "Desktop feature not configured"
**Problem:** E2B API key missing  
**Solution:** Set `E2B_API_KEY` in `.env.local` and restart dev server

### "Sandbox creation timed out"
**Problem:** E2B service slow or unreachable  
**Solution:** Try again, or check E2B status at [e2b.dev/status](https://e2b.dev/status)

### "Failed to connect to desktop stream"
**Problem:** VNC connection failed  
**Solution:** Refresh page, or try launching again

### Desktop shows old state
**Problem:** Screenshot is stale  
**Solution:** Agent will take new screenshot on next action

### Sandbox disappeared
**Problem:** Sandbox expired (5 minute timeout)  
**Solution:** Launch new desktop, or increase timeout in `.env.local`:
```bash
E2B_DESKTOP_TIMEOUT_MS=900000  # 15 minutes
```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Flowzone Frontend               │
│  ┌─────────────────────────────────┐   │
│  │ Chat Panel                      │   │
│  │ ├─ Launch Desktop button        │   │
│  │ ├─ Message input                │   │
│  │ └─ Message display              │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ Desktop View                    │   │
│  │ └─ VNC iframe                   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
           ↓ API Calls ↓
┌─────────────────────────────────────────┐
│         Flowzone Backend                │
│  ┌─────────────────────────────────┐   │
│  │ POST /api/desktop               │   │
│  │ DELETE /api/desktop             │   │
│  │ GET /api/desktop/[id]/status    │   │
│  │ POST /api/chat/[id]/desktop     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
           ↓ E2B SDK ↓
┌─────────────────────────────────────────┐
│      E2B Desktop Sandbox                │
│  ┌─────────────────────────────────┐   │
│  │ Linux GUI (XFCE4)               │   │
│  │ ├─ VNC Server                   │   │
│  │ ├─ Desktop Agent                │   │
│  │ ├─ 18 Computer-Use Tools        │   │
│  │ └─ Pre-installed Tools          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/desktop-client.ts` | API helpers |
| `components/editor/desktop-launcher.tsx` | Launch button |
| `components/chat/chat-panel.tsx` | Message routing |
| `components/editor/desktop-view.tsx` | VNC display + monitoring |
| `components/chat/message-parts.tsx` | Screenshot rendering |
| `app/api/desktop/route.ts` | Create/delete sandbox |
| `app/api/chat/[id]/desktop/route.ts` | Desktop agent endpoint |
| `app/api/desktop/[id]/status/route.ts` | Status polling |

---

## Next Steps

1. **Try it out** — Launch desktop and take a screenshot
2. **Build something** — Create a React app or Node.js project
3. **Explore tools** — See what the agent can do
4. **Read docs** — Check [AGENT.md](./AGENT.md) for workflows
5. **Customize** — Modify template or tools as needed

---

## Support

- **Docs:** See [README.md](./README.md) for full documentation
- **Issues:** Check [GAPS.md](./GAPS.md) for known limitations
- **Setup:** See [SETUP.md](./SETUP.md) for configuration
- **API:** See [API.md](./API.md) for endpoint details
