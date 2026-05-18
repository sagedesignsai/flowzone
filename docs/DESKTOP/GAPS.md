# Missing Features & Implementation Roadmap

Critical gaps preventing end-to-end desktop functionality.

## Critical Gaps (Blocking)

### 1. No Desktop Launch Trigger ⚠️ CRITICAL
**Status:** Missing UI/API integration  
**Impact:** Users cannot start a desktop session  
**Effort:** 2-4 hours

**Current State:**
- `DesktopView` component exists and renders VNC iframe when `desktopVncUrl` is set
- `useIdeStore` has `setDesktopSandbox()` to store sandbox ID and VNC URL
- API route `POST /api/desktop` creates sandbox and returns `vncUrl`
- **BUT:** No UI button or trigger to call `POST /api/desktop`

**What's Missing:**
- Button/action in chat panel or toolbar to launch desktop
- Client-side function to call `POST /api/desktop` with `chatId` and `projectId`
- Error handling for desktop creation failures
- Loading state while desktop is starting

**Implementation:**
```typescript
// Add to chat panel or toolbar
const handleLaunchDesktop = async () => {
  setDesktopStatus("starting")
  try {
    const response = await fetch("/api/desktop", {
      method: "POST",
      body: JSON.stringify({ chatId, projectId }),
    })
    const { sandboxId, vncUrl } = await response.json()
    setDesktopSandbox(sandboxId, vncUrl)
    setViewMode("desktop")
  } catch (error) {
    setDesktopStatus("error")
  }
}
```

**Files to Create:**
- `components/editor/desktop-launcher.tsx` — Launch button/dialog

**Files to Modify:**
- `components/chat/chat-panel.tsx` — Add launch button
- `components/editor/editor-panel.tsx` — Add launch action

---

### 2. No Desktop Agent Routing ⚠️ CRITICAL
**Status:** Missing message routing logic  
**Impact:** Chat messages don't reach desktop agent  
**Effort:** 2-3 hours

**Current State:**
- `POST /api/chat/[id]/desktop` route exists and works
- Desktop agent is fully implemented with all tools
- Chat panel sends messages to `/api/chat/[id]` (default route)
- **BUT:** No logic to route messages to desktop agent when desktop is active

**What's Missing:**
- Detect when desktop sandbox is active in chat panel
- Route messages to `/api/chat/[id]/desktop` instead of `/api/chat/[id]`
- Pass `sandboxId` in request body to desktop route
- Handle switching between regular and desktop agent

**Implementation:**
```typescript
// In ChatPanel component
const { desktopSandboxId } = useIdeStore()

const handlePromptSubmit = async (message) => {
  const endpoint = desktopSandboxId 
    ? `/api/chat/${chatId}/desktop`
    : `/api/chat/${chatId}`
  
  const body = desktopSandboxId
    ? { messages: [...], sandboxId: desktopSandboxId }
    : { messages: [...] }
  
  // Send to appropriate endpoint
}
```

**Files to Modify:**
- `components/chat/chat-panel.tsx` — Add routing logic
- `lib/desktop-client.ts` (new) — Desktop API helpers

---

### 3. No Desktop-Specific Message Handling ⚠️ CRITICAL
**Status:** Missing tool response rendering  
**Impact:** Screenshots and tool outputs not displayed  
**Effort:** 3-4 hours

**Current State:**
- Desktop agent returns tool results (screenshots, command output, etc.)
- `MessageParts` component renders message parts
- **BUT:** No special handling for desktop-specific parts:
  - Screenshots (base64 PNG images)
  - Tool execution results
  - Desktop state changes

**What's Missing:**
- Renderer for screenshot parts in message display
- Formatter for tool output (mouse clicks, keyboard input, etc.)
- Visual feedback when tools execute
- Error display for failed tool calls

**Implementation:**
```typescript
// In MessageParts component
if (part.type === "tool-result") {
  if (part.toolName === "takeScreenshot") {
    return <img src={`data:image/png;base64,${part.result.screenshot}`} />
  }
  if (part.toolName === "runShellCommand") {
    return <TerminalOutput stdout={part.result.stdout} />
  }
}
```

**Files to Modify:**
- `components/ai-elements/message.tsx` — Add screenshot rendering
- `components/chat/message-parts.tsx` — Add tool result formatting

---

## High Priority Gaps

### 4. No Desktop Status Monitoring ⚠️ HIGH
**Status:** Missing lifecycle management  
**Impact:** Sandbox timeouts, orphaned sessions, unclear state  
**Effort:** 3-4 hours

**Current State:**
- Desktop status stored in `useIdeStore` (idle/starting/running/stopping/error)
- `DesktopView` shows "Running" badge when active
- **BUT:** No polling or monitoring of actual sandbox state
- No heartbeat to keep sandbox alive during long operations
- No detection of sandbox expiration

**What's Missing:**
- Periodic health check to `/api/desktop/[id]/status` (endpoint doesn't exist)
- Automatic cleanup when sandbox expires
- User notification when sandbox is about to timeout
- Reconnection logic if connection drops

**Implementation:**
```typescript
// Add API endpoint
// GET /api/desktop/[id]/status → returns { status, timeRemaining }

// Add to DesktopView
useEffect(() => {
  if (!desktopSandboxId) return
  const interval = setInterval(async () => {
    const res = await fetch(`/api/desktop/${desktopSandboxId}/status`)
    if (!res.ok) clearDesktopSandbox() // Sandbox expired
  }, 30000)
  return () => clearInterval(interval)
}, [desktopSandboxId])
```

**Files to Create:**
- `app/api/desktop/[id]/status/route.ts` — Status endpoint

**Files to Modify:**
- `components/editor/desktop-view.tsx` — Add polling
- `hooks/use-ide-store.ts` — Add timeout tracking

---

### 5. No Desktop Cleanup on Chat End ⚠️ HIGH
**Status:** Missing resource management  
**Impact:** Orphaned sandboxes, wasted resources  
**Effort:** 2-3 hours

**Current State:**
- `DesktopView` has stop button that calls `DELETE /api/desktop`
- **BUT:** No automatic cleanup when:
  - User navigates away from chat
  - Chat is deleted
  - Browser tab closes
  - Session expires

**What's Missing:**
- Cleanup on component unmount
- Cleanup on chat deletion
- Cleanup on logout
- Graceful shutdown on page unload

**Implementation:**
```typescript
// In ChatPage or DesktopView
useEffect(() => {
  return () => {
    if (desktopSandboxId) {
      fetch("/api/desktop", {
        method: "DELETE",
        body: JSON.stringify({ sandboxId: desktopSandboxId }),
      }).catch(() => {}) // Best effort
    }
  }
}, [desktopSandboxId])
```

**Files to Modify:**
- `components/editor/desktop-view.tsx` — Add cleanup
- `app/chat/[id]/page.tsx` — Add cleanup on unmount

---

### 6. No Desktop-Specific Error Handling ⚠️ HIGH
**Status:** Missing error recovery  
**Impact:** Unclear failures, poor UX  
**Effort:** 2-3 hours

**Current State:**
- Generic error handling in chat panel
- **BUT:** No specific handling for:
  - E2B API key missing
  - Sandbox creation timeout
  - VNC connection failure
  - Tool execution errors

**What's Missing:**
- Specific error messages for each failure mode
- Retry logic for transient failures
- Fallback to regular agent if desktop fails
- User guidance on how to fix errors

**Implementation:**
```typescript
// Add error type detection
if (error.message.includes("E2B_API_KEY")) {
  showError("Desktop feature not configured. Contact admin.")
} else if (error.message.includes("timeout")) {
  showError("Sandbox creation timed out. Try again.")
} else if (error.message.includes("VNC")) {
  showError("Failed to connect to desktop. Retrying...")
}
```

**Files to Modify:**
- `components/editor/desktop-view.tsx` — Add error handling
- `components/chat/chat-panel.tsx` — Add error messages

---

## Medium Priority Gaps

### 7. No Desktop Initialization Feedback ⚠️ MEDIUM
**Status:** Missing UX feedback  
**Impact:** Users don't know desktop is starting  
**Effort:** 1-2 hours

**Current State:**
- `desktopStatus` in store (idle/starting/running/stopping/error)
- **BUT:** Not used in UI
- No loading indicator while desktop starts
- No progress feedback

**What's Missing:**
- Show "Starting desktop..." while creating sandbox
- Display progress/loading state in DesktopView
- Show estimated time to ready
- Cancel button during startup

**Implementation:**
```typescript
// In DesktopView
{desktopStatus === "starting" && (
  <div className="flex items-center justify-center gap-2">
    <Spinner />
    <span>Starting desktop... (this may take 30 seconds)</span>
  </div>
)}
```

**Files to Modify:**
- `components/editor/desktop-view.tsx` — Add loading state

---

## Low Priority Gaps

### 8. No Desktop Persistence Across Reloads
**Status:** Nice to have  
**Impact:** Desktop session lost on page refresh  
**Effort:** 2-3 hours

**Solution:** Store `sandboxId` in localStorage and reconnect on page load

---

### 9. No Multi-Desktop Support
**Status:** Nice to have  
**Impact:** Only one desktop per chat  
**Effort:** 4-6 hours

**Solution:** Allow multiple desktops for parallel tasks

---

### 10. No Desktop Recording/Replay
**Status:** Nice to have  
**Impact:** No way to review what happened  
**Effort:** 6-8 hours

**Solution:** Record VNC stream for debugging

---

### 11. No Desktop Customization
**Status:** Nice to have  
**Impact:** Resolution hardcoded to 1280×800  
**Effort:** 2-3 hours

**Solution:** Allow user to choose resolution

---

## Implementation Priority

### Phase 1 (Blocking - Week 1)
1. Desktop launch trigger (Gap #1) — 2-4h
2. Desktop agent routing (Gap #2) — 2-3h
3. Desktop-specific message handling (Gap #3) — 3-4h

**Total:** 7-11 hours

### Phase 2 (High Priority - Week 2)
4. Desktop status monitoring (Gap #4) — 3-4h
5. Desktop cleanup (Gap #5) — 2-3h
6. Error handling (Gap #6) — 2-3h

**Total:** 7-10 hours

### Phase 3 (Polish - Week 3)
7. Initialization feedback (Gap #7) — 1-2h
8. Persistence (Gap #8) — 2-3h
9. Recording (Gap #10) — 6-8h

**Total:** 9-13 hours

---

## Files That Need Changes

### New Files Needed
- `components/editor/desktop-launcher.tsx` — Launch button/dialog
- `lib/desktop-client.ts` — Client-side desktop API helpers
- `app/api/desktop/[id]/status/route.ts` — Status endpoint

### Files to Modify
- `components/chat/chat-panel.tsx` — Add desktop routing logic
- `components/editor/desktop-view.tsx` — Add status monitoring, cleanup, error handling
- `components/ai-elements/message.tsx` — Add screenshot rendering
- `components/chat/message-parts.tsx` — Add tool result formatting
- `hooks/use-ide-store.ts` — Add desktop lifecycle methods
- `app/api/desktop/route.ts` — Add error handling
- `app/chat/[id]/page.tsx` — Add cleanup on unmount

---

## Testing Checklist

### Phase 1
- [ ] Desktop launch button appears in chat panel
- [ ] Clicking launch creates sandbox and shows VNC
- [ ] Messages route to desktop agent when desktop is active
- [ ] Screenshots display in chat
- [ ] Tool results display in chat

### Phase 2
- [ ] Status badge shows "Running"
- [ ] Sandbox cleanup on stop button
- [ ] Sandbox cleanup on page unload
- [ ] Error messages are specific and helpful
- [ ] Retry logic works for transient failures

### Phase 3
- [ ] Loading indicator shows during startup
- [ ] Sandbox persists across page reload
- [ ] Multiple desktops can run in parallel
- [ ] VNC stream is recorded
- [ ] User can customize resolution

---

## Summary

The virtual desktop system has **solid infrastructure** but is **missing the user-facing integration layer**. The core tools, agent, and API routes are complete, but there's no way for users to:

1. **Start** a desktop session
2. **Route** messages to the desktop agent
3. **See** what the agent is doing
4. **Manage** the desktop lifecycle

Implementing Phase 1 (7-11 hours) will make the system fully functional end-to-end.
