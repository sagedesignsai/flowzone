# Flowzone Desktop Template — Implementation Plan

## Overview

Build a custom E2B desktop sandbox template pre-configured for Flowzone's AI coding workflow. The template extends E2B's base `desktop` template and adds OpenCode CLI, Node.js/pnpm, GitHub CLI, git configuration, Flowzone branding, and a pipeline bridge script.

## Architecture Decision

**Extend, don't rebuild**: Use `Template.from_template("desktop")` to inherit the base XFCE desktop (saves ~15min build time, inherits all desktop setup), then layer Flowzone-specific additions on top.

---

## Phase 1: Template Build System

### Directory Structure
```
template/flowzone-desktop/
├── template.py              # Template definition (extends "desktop")
├── build_dev.py             # Dev build: alias "flowzone-desktop-dev"
├── build_prod.py            # Prod build: alias "flowzone-desktop"
├── pyproject.toml           # Poetry deps (e2b SDK)
├── README.md                # Build instructions
└── files/                   # Config files copied into template
    ├── flowzone-bridge.sh   # Pipeline bridge script
    ├── gitconfig            # Global git config template
    ├── opencode-config.json # OpenCode default config
    ├── wallpaper.png        # Flowzone branded wallpaper (placeholder)
    ├── xfce4-desktop.xml    # Wallpaper path + display config
    ├── screensaver.desktop  # Disable screen blanking
    ├── vscode-settings.json # VS Code config (auto-save, trust)
    └── google-chrome.desktop # Chrome launch flags
```

### template.py — Core Definition

```python
from e2b import Template, CopyItem, wait_for_timeout

# Extend the base desktop template (inherits XFCE, browsers, noVNC, etc.)
template = (
    Template(file_context_path="files")
    .from_template("desktop")     # ← extends E2B's public desktop template
    .set_user("root")
    .set_workdir("/")
    
    # ── Dev Tools ──────────────────────────────────────────
    .run_cmd("curl -fsSL https://deb.nodesource.com/setup_22.x | bash -")
    .apt_install(["nodejs", "gh"])
    .run_cmd("npm install -g pnpm")
    
    # ── OpenCode CLI (primary: curl script) ────────────────
    .run_cmd("OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash")
    # Fallback: npm if curl fails
    .run_cmd("npm install -g opencode-ai || true")
    
    # ── Git Configuration ─────────────────────────────────
    .run_cmd("git config --system credential.helper store")
    .run_cmd("git config --system init.defaultBranch main")
    .run_cmd("git config --system core.autocrlf input")
    
    # ── Flowzone Bridge Script ─────────────────────────────
    .copy_items([
        CopyItem(src="flowzone-bridge.sh", dest="/usr/local/bin/flowzone-bridge"),
    ])
    .run_cmd("chmod +x /usr/local/bin/flowzone-bridge")
    
    # ── OpenCode Default Config ────────────────────────────
    .run_cmd("mkdir -p /home/user/.config/opencode")
    .copy_items([
        CopyItem(src="opencode-config.json", dest="/home/user/.config/opencode/config.json"),
    ])
    
    # ── Git Config Template ───────────────────────────────
    .copy_items([
        CopyItem(src="gitconfig", dest="/home/user/.gitconfig"),
    ])
    
    # ── VS Code Settings ──────────────────────────────────
    .run_cmd("mkdir -p /home/user/.config/Code/User")
    .copy_items([
        CopyItem(src="vscode-settings.json", dest="/home/user/.config/Code/User/settings.json"),
    ])
    
    # ── Flowzone Branding ─────────────────────────────────
    .copy_items([
        CopyItem(src="wallpaper.png", dest="/usr/share/backgrounds/xfce/flowzone.png"),
        CopyItem(src="xfce4-desktop.xml", dest="/home/user/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml"),
        CopyItem(src="screensaver.desktop", dest="/home/user/.config/autostart/screensaver.desktop"),
        CopyItem(src="google-chrome.desktop", dest="/usr/share/applications/google-chrome.desktop"),
    ])
    
    # ── System Cleanup ────────────────────────────────────
    .run_cmd("apt-get clean && rm -rf /var/lib/apt/lists/*")
    .run_cmd("update-desktop-database /usr/share/applications/")
)

# Runtime user/workdir
template_with_user_workdir = template.set_user("user").set_workdir("/home/user")
```

### Build Scripts

**build_prod.py:**
```python
from dotenv import load_dotenv
from e2b import Template, default_build_logger
from template import template_with_user_workdir

load_dotenv()

Template.build(
    template_with_user_workdir,
    "flowzone-desktop",
    cpu_count=8,
    memory_mb=8192,
    on_build_logs=default_build_logger(),
)
```

**build_dev.py:** Same but alias `"flowzone-desktop-dev"`

**pyproject.toml:**
```toml
[project]
name = "flowzone_desktop"
version = "0.1.0"
description = "Flowzone Desktop Sandbox Template"

[tool.poetry]
package-mode = false

[tool.poetry.dependencies]
python = "^3.10"
e2b = "^2.20.3"

[tool.poetry.group.dev.dependencies]
dotenv = "^0.9.9"
```

---

## Phase 2: Config Files

### flowzone-bridge.sh
```bash
#!/bin/bash
# Flowzone Pipeline Bridge — communicates between desktop sandbox and Flowzone API
# Usage: flowzone-bridge <command> [options]

set -e

FLOWZONE_API_URL="${FLOWZONE_API_URL:-http://localhost:3000}"
FLOWZONE_CHAT_ID="${FLOWZONE_CHAT_ID:-}"
FLOWZONE_PROJECT_ID="${FLOWZONE_PROJECT_ID:-}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

case "$1" in
  report-status)
    # POST task completion status to Flowzone
    shift
    STATUS="$1"; shift
    curl -s -X POST "$FLOWZONE_API_URL/api/desktop/status" \
      -H "Content-Type: application/json" \
      -d "{\"chatId\":\"$FLOWZONE_CHAT_ID\",\"status\":\"$STATUS\",\"data\":$@}"
    ;;
  push-changes)
    # Commit and push changes via GitHub API
    shift
    MESSAGE="$1"; shift
    BRANCH="${1:-main}"
    REPO_PATH="${2:-/home/user/repo}"
    cd "$REPO_PATH"
    git add -A
    git commit -m "Flowzone: $MESSAGE" || true
    git push origin "$BRANCH"
    ;;
  get-context)
    # Fetch project context from Flowzone
    curl -s "$FLOWZONE_API_URL/api/desktop/context?chatId=$FLOWZONE_CHAT_ID"
    ;;
  *)
    echo "Usage: flowzone-bridge {report-status|push-changes|get-context}"
    exit 1
    ;;
esac
```

### gitconfig
```ini
[init]
    defaultBranch = main
[core]
    autocrlf = input
[credential]
    helper = store
```

### opencode-config.json
```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  },
  "model": "anthropic/claude-sonnet-4-20250514",
  "permission": {
    "bash": "true",
    "read": "true",
    "edit": "true",
    "glob": "true",
    "grep": "true",
    "webfetch": "true"
  }
}
```

### vscode-settings.json
```json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 200,
  "security.allowHttp": true,
  "security.workspace.trust.startupPrompt": "never",
  "security.workspace.trust.enabled": false,
  "security.workspace.trust.banner": "never",
  "security.workspace.trust.emptyWindow": false,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### xfce4-desktop.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-desktop" version="1.0">
    <property name="backdrop" type="empty">
        <property name="screen0" type="empty">
            <property name="monitorscreen" type="empty">
                <property name="workspace0" type="empty">
                    <property name="last-image" type="string"
                        value="/usr/share/backgrounds/xfce/flowzone.png" />
                    <property name="color-style" type="int" value="0" />
                    <property name="image-style" type="int" value="5" />
                </property>
            </property>
        </property>
    </property>
</channel>
```

### screensaver.desktop
```ini
[Desktop Entry]
Type=Application
Name=Disable Screen Blanking
Exec=sh -c "sleep 2; xset s off; xset s noblank; xset -dpms"
Hidden=false
NoDisplay=true
X-GNOME-Autostart-enabled=true
```

### google-chrome.desktop
```ini
[Desktop Entry]
Version=1.0
Name=Google Chrome
Exec=/usr/bin/google-chrome-stable --no-first-run --no-default-browser-check --password-store=basic
Terminal=false
Icon=google-chrome
Type=Application
Categories=Network;WebBrowser;
MimeType=text/html;text/xml;application/xhtml_xml;x-scheme-handler/http;x-scheme-handler/https;
StartupWMClass=Google-chrome
```

### wallpaper.png
Placeholder 1280x800 PNG with Flowzone branding (gradient + logo). Can be replaced later.

---

## Phase 3: API Route Updates

### Update `app/api/desktop/route.ts`

**Changes:**
1. Add `template` parameter to `Sandbox.create()`
2. Pass Flowzone context via `envs`
3. Pass metadata for tracking
4. Add status tracking during creation

```typescript
// POST — Create sandbox
const desktop = await Sandbox.create("flowzone-desktop", {
  resolution: [1280, 800],
  dpi: 96,
  timeoutMs,
  envs: {
    FLOWZONE_API_URL: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
    FLOWZONE_CHAT_ID: chatId || "",
    FLOWZONE_PROJECT_ID: projectId || "",
    GITHUB_TOKEN: githubToken || "",
    GIT_AUTHOR_NAME: session.user.name || "Flowzone User",
    GIT_AUTHOR_EMAIL: session.user.email || "user@flowzone.dev",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  },
  metadata: {
    userId: session.user.id,
    projectId: projectId || "",
    chatId: chatId || "",
  },
})
```

### New Route: `app/api/desktop/status/route.ts`

**POST** — Receives status reports from `flowzone-bridge.sh` inside the sandbox.

```typescript
// Request: { chatId, status, data }
// Updates SandboxRun or AgentRun in DB
// Returns { success: true }
```

### New Route: `app/api/desktop/context/route.ts`

**GET** — Returns project context for the bridge script.

```typescript
// Query: ?chatId=xxx
// Returns: { repoUrl, branch, repoPath, envVars }
```

---

## Phase 4: Client-Side Wiring (Gaps to Fill)

### 4.1 Desktop Sandbox Creation Hook

Create `hooks/use-desktop-sandbox.ts`:
```typescript
// Manages desktop sandbox lifecycle:
// - createSandbox() → POST /api/desktop
// - stopSandbox() → DELETE /api/desktop
// - reconnectSandbox() → POST /api/desktop/[id]
// - Status transitions: idle → creating → running → stopping → idle
// - Auto-extend timeout on activity
// - VNC URL refresh on expiration
```

### 4.2 Desktop Chat Transport

Update `components/chat/chat-panel.tsx` to switch transport URL when desktop mode is active:
```typescript
// When viewMode === "desktop" && desktopSandboxId:
// transport = new DefaultChatTransport({
//   api: `/api/chat/${chatId}/desktop`,
//   body: { sandboxId: desktopSandboxId },
// })
```

### 4.3 Start Desktop Button

Add a "Start Desktop" button to the editor panel or global header when no desktop session is active.

---

## Phase 5: .env.example Update

Add:
```bash
# ── Desktop Template ─────────────────────────────────────
# Custom E2B desktop template name (built from template/flowzone-desktop/)
E2B_DESKTOP_TEMPLATE="flowzone-desktop"

# Flowzone API URL (used by bridge script inside sandbox)
NEXT_PUBLIC_URL="http://localhost:3000"
```

---

## Phase 6: Build & Deploy Pipeline

### Manual Build (Initial)
```bash
cd template/flowzone-desktop
poetry install
poetry run python build_dev.py   # dev template
poetry run python build_prod.py  # prod template
```

### Automated Build (Future GitHub Action)
```yaml
name: Build Desktop Template
on:
  push:
    paths:
      - 'template/flowzone-desktop/**'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install poetry
      - run: poetry install --no-root
        working-directory: template/flowzone-desktop
      - run: poetry run python build_prod.py
        working-directory: template/flowzone-desktop
        env:
          E2B_API_KEY: ${{ secrets.E2B_API_KEY }}
```

---

## File Change Summary

### New Files (13)
| File | Purpose |
|------|---------|
| `template/flowzone-desktop/template.py` | Template definition |
| `template/flowzone-desktop/build_dev.py` | Dev build script |
| `template/flowzone-desktop/build_prod.py` | Prod build script |
| `template/flowzone-desktop/pyproject.toml` | Poetry config |
| `template/flowzone-desktop/README.md` | Build docs |
| `template/flowzone-desktop/files/flowzone-bridge.sh` | Pipeline bridge |
| `template/flowzone-desktop/files/gitconfig` | Git config template |
| `template/flowzone-desktop/files/opencode-config.json` | OpenCode config |
| `template/flowzone-desktop/files/wallpaper.png` | Flowzone wallpaper |
| `template/flowzone-desktop/files/xfce4-desktop.xml` | XFCE wallpaper config |
| `template/flowzone-desktop/files/screensaver.desktop` | Disable screensaver |
| `template/flowzone-desktop/files/vscode-settings.json` | VS Code settings |
| `template/flowzone-desktop/files/google-chrome.desktop` | Chrome desktop entry |

### Modified Files (3)
| File | Changes |
|------|---------|
| `app/api/desktop/route.ts` | Add template param, envs, metadata |
| `.env.example` | Add E2B_DESKTOP_TEMPLATE, NEXT_PUBLIC_URL |

### Future Files (Phase 4 — separate PR)
| File | Purpose |
|------|---------|
| `hooks/use-desktop-sandbox.ts` | Sandbox lifecycle hook |
| `app/api/desktop/status/route.ts` | Bridge status endpoint |
| `app/api/desktop/context/route.ts` | Bridge context endpoint |
| `components/chat/chat-panel.tsx` | Desktop transport switching |
| `components/layout/global-header.tsx` | Start Desktop button |

---

## Verification

### 1. Template Build
```bash
cd template/flowzone-desktop
poetry install
poetry run python build_dev.py
# Should complete with "Template built: flowzone-desktop-dev"
```

### 2. Sandbox Creation
```bash
# After building, test sandbox creation:
curl -X POST http://localhost:3000/api/desktop \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>"
# Should return { sandboxId, vncUrl }
```

### 3. Inside Sandbox Verification
```bash
# Connect to sandbox and verify:
opencode --version          # Should output version
node --version              # Should output v22.x
pnpm --version              # Should output version
gh --version                # Should output version
flowzone-bridge --help      # Should show usage
cat /home/user/.gitconfig   # Should show Flowzone config
ls /usr/share/backgrounds/xfce/flowzone.png  # Should exist
```

### 4. Lint + Typecheck
```bash
pnpm lint
pnpm typecheck
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OpenCode curl install fails in build | Fallback to `npm install -g opencode-ai` |
| Template build takes too long | Extending "desktop" template (not rebuilding from ubuntu) saves ~15min |
| Bridge script security | Only POSTs to Flowzone API, no sensitive data in env vars |
| VNC URL expiration | Reconnect route exists; client-side hook will auto-refresh |
| Sandbox ownership | Future: add DB record linking sandboxId to userId |

---

## Execution Order

1. **Create template directory structure** (all 13 files)
2. **Update `app/api/desktop/route.ts`** (template param + envs)
3. **Update `.env.example`**
4. **Build template** (manual `poetry run python build_prod.py`)
5. **Test sandbox creation** (verify all tools installed)
6. **Phase 4** (client-side wiring — separate PR)
