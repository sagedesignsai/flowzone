# Desktop Tools Reference

Complete reference for all 18 computer-use tools available in the desktop agent.

## Mouse Tools (6)

### mouseLeftClick
Left-click at coordinates or current cursor position.

```typescript
await mouseLeftClick({ x: 640, y: 400 })
// or click at current position
await mouseLeftClick({})
```

**Returns:** `{ success: true, x?, y? }`

---

### mouseRightClick
Right-click for context menus.

```typescript
await mouseRightClick({ x: 640, y: 400 })
```

**Returns:** `{ success: true, x?, y? }`

---

### mouseDoubleClick
Double left-click for activation.

```typescript
await mouseDoubleClick({ x: 640, y: 400 })
```

**Returns:** `{ success: true, x?, y? }`

---

### mouseScroll
Scroll the mouse wheel.

```typescript
await mouseScroll({ direction: "down", amount: 3 })
// or scroll up
await mouseScroll({ direction: "up", amount: 5 })
```

**Parameters:**
- `direction`: "up" | "down" (default: "down")
- `amount`: number (default: 3)

**Returns:** `{ success: true, direction, amount }`

---

### mouseMove
Move cursor without clicking.

```typescript
await mouseMove({ x: 640, y: 400 })
```

**Returns:** `{ success: true, x, y }`

---

### mouseDrag
Click and drag from one position to another.

```typescript
await mouseDrag({ fromX: 100, fromY: 100, toX: 500, toY: 500 })
```

**Returns:** `{ success: true, fromX, fromY, toX, toY }`

---

## Keyboard Tools (3)

### keyboardType
Type text at current cursor position.

```typescript
await keyboardType({ 
  text: "Hello, World!",
  chunkSize: 25,      // characters per chunk (default: 25)
  delayInMs: 75       // delay between chunks (default: 75)
})
```

**Returns:** `{ success: true, length }`

---

### keyboardPress
Press a single key.

```typescript
await keyboardPress({ key: "enter" })
// or
await keyboardPress({ key: "escape" })
await keyboardPress({ key: "tab" })
await keyboardPress({ key: "backspace" })
await keyboardPress({ key: "space" })
await keyboardPress({ key: "f5" })
```

**Common keys:** enter, escape, tab, backspace, space, up, down, left, right, f1-f12

**Returns:** `{ success: true, key }`

---

### keyboardShortcut
Press key combinations.

```typescript
await keyboardShortcut({ keys: ["ctrl", "c"] })
await keyboardShortcut({ keys: ["ctrl", "shift", "z"] })
await keyboardShortcut({ keys: ["alt", "tab"] })
await keyboardShortcut({ keys: ["cmd", "a"] })  // macOS
```

**Returns:** `{ success: true, keys }`

---

## Screen Tools (3)

### takeScreenshot
Capture desktop as base64 PNG.

```typescript
const result = await takeScreenshot({})
// result.screenshot: base64 string
// result.mimeType: "image/png"
// result.width: 1280
// result.height: 800
```

**Returns:** `{ screenshot: string, mimeType: "image/png", width, height }`

**Usage:** Always take screenshot after significant actions to verify state.

---

### getScreenSize
Get current screen resolution.

```typescript
const { width, height } = await getScreenSize({})
// width: 1280, height: 800
```

**Returns:** `{ width: number, height: number }`

---

### getCursorPosition
Get current mouse cursor position.

```typescript
const { x, y } = await getCursorPosition({})
```

**Returns:** `{ x: number, y: number }`

---

## Application Tools (4)

### launchApp
Launch a desktop application.

```typescript
await launchApp({ application: "google-chrome" })
// with URI
await launchApp({ application: "google-chrome", uri: "http://localhost:3000" })
// other apps
await launchApp({ application: "code" })           // VS Code
await launchApp({ application: "xterm" })          // Terminal
await launchApp({ application: "gedit" })          // Text editor
await launchApp({ application: "thunar" })         // File manager
await launchApp({ application: "firefox" })        // Firefox
```

**Returns:** `{ success: true, application, uri? }`

---

### openFile
Open file or URL with default application.

```typescript
await openFile({ path: "/home/user/document.pdf" })
await openFile({ path: "http://example.com" })
```

**Returns:** `{ success: true, path }`

---

### getWindowTitle
Get title of a window by ID.

```typescript
const { title } = await getWindowTitle({ windowId: "0x1234567" })
```

**Returns:** `{ windowId, title }`

---

### runShellCommand
Execute shell commands.

```typescript
// Blocking command
const result = await runShellCommand({ 
  command: "npm install",
  workdir: "/home/user/project"
})
// result.stdout, result.stderr, result.exitCode

// Background command (non-blocking)
await runShellCommand({ 
  command: "npm run dev",
  background: true,
  workdir: "/home/user/project"
})
```

**Parameters:**
- `command`: string (shell command)
- `background`: boolean (default: false) — non-blocking if true
- `workdir`: string (optional) — working directory

**Returns:** `{ stdout: string, stderr: string, exitCode: number }`

**Use Cases:**
- Install packages: `npm install`, `pnpm add`
- Start servers: `npm run dev` (with `background: true`)
- Check status: `git status`, `npm list`
- View logs: `cat /var/log/app.log`

---

## OpenCode Tool (1)

### runOpenCodeTask
Delegate complex coding tasks to OpenCode CLI inside sandbox.

```typescript
await runOpenCodeTask({
  prompt: "Create a React component for a todo list with add/delete functionality",
  workdir: "/home/user/project"
})
```

**Parameters:**
- `prompt`: string (detailed instructions for what to code)
- `workdir`: string (optional) — working directory

**Returns:** `{ stdout: string, stderr: string, exitCode: number, prompt: string }`

**Best For:**
- Multi-file code changes
- Complex refactoring
- Scaffolding new features
- Debugging code issues

**Example Prompts:**
- "Create a Next.js API route at `/api/users` that returns a list of users from the database"
- "Refactor the authentication module to use JWT tokens instead of sessions"
- "Add TypeScript types to all functions in `src/utils.ts`"
- "Fix the failing tests in `__tests__/auth.test.ts`"

---

## Tool Execution Flow

### Typical Agent Workflow

```
1. takeScreenshot()
   ↓ (see current state)
2. Analyze screenshot
   ↓
3. Execute action (click, type, launch app, etc.)
   ↓
4. takeScreenshot()
   ↓ (verify result)
5. Repeat or complete
```

### Best Practices

**Always verify with screenshots:**
```typescript
// ❌ Don't do this
await mouseLeftClick({ x: 640, y: 400 })
await keyboardType({ text: "hello" })

// ✅ Do this
await takeScreenshot()  // See current state
await mouseLeftClick({ x: 640, y: 400 })
await takeScreenshot()  // Verify click worked
await keyboardType({ text: "hello" })
await takeScreenshot()  // Verify text was typed
```

**Use background mode for long-running processes:**
```typescript
// Start dev server in background
await runShellCommand({ 
  command: "npm run dev",
  background: true,
  workdir: "/home/user/project"
})

// Then verify it started
await takeScreenshot()
// or check port
await runShellCommand({ command: "lsof -i :3000" })
```

**Delegate complex tasks to OpenCode:**
```typescript
// ❌ Don't try to code manually
await keyboardType({ text: "function fibonacci(n) { ... }" })

// ✅ Use OpenCode
await runOpenCodeTask({
  prompt: "Implement a fibonacci function with memoization in src/utils.ts"
})
```

---

## Error Handling

All tools return structured results. Check for errors:

```typescript
const result = await runShellCommand({ command: "npm install" })

if (result.exitCode !== 0) {
  console.error("Command failed:", result.stderr)
  // Handle error
}
```

---

## Performance Notes

| Tool | Typical Time |
|------|-------------|
| takeScreenshot | ~500ms |
| mouseLeftClick | ~100ms |
| keyboardType | ~500ms (depends on text length) |
| runShellCommand | Varies (1s - minutes) |
| runOpenCodeTask | 10s - 5min (depends on task) |
| launchApp | 2-5s |

---

## Limitations

- **No clipboard access** from tools (VNC iframe has clipboard-read/write permissions)
- **No file upload** directly (use `runShellCommand` with `curl` or `wget`)
- **No audio/video** capture (screenshots only)
- **No multi-monitor** support (single 1280×800 display)
- **No GPU acceleration** (CPU-only rendering)
