# Flowzone Desktop Template (TypeScript)

E2B desktop sandbox template for Flowzone, extending the base desktop template with OpenCode CLI, Node.js 22, pnpm, GitHub CLI, Python 3, Go, Rust, and Flowzone bridge integration.

## Features

- **OpenCode CLI** — AI-powered development agent pre-installed with dynamic config from env vars
- **Node.js 22 + pnpm** — Latest LTS runtime with pnpm package manager
- **Python 3 + pip** — Scripting, ML, backend development
- **Go 1.22** — Backend and CLI development
- **Rust** — Performance-critical code (installed via rustup)
- **GitHub CLI** — `gh` for repository and PR operations
- **CLI Tools** — jq, ripgrep, fzf, make, gcc, g++
- **Flowzone Bridge** — Shell script + OpenCode plugin connecting sandbox to Flowzone platform
- **Desktop Portal** — Browser-based status dashboard (http://localhost:9090)
- **Pre-configured** — Git, VS Code, XFCE desktop settings (wallpaper, fonts, screensaver)
- **Fonts** — Noto fonts (including CJK + emoji), Fira Code

### XFCE4 Desktop Enhancements

- **Desktop notifications** via `notify-send` — sandbox ready, git push, OpenCode events
- **Keyboard shortcuts** — Ctrl+Alt+P (push), Ctrl+Alt+S (portal), Ctrl+Alt+T (terminal)
- **Thunar custom actions** — Right-click → Push to Flowzone / Open Terminal / Copy Remote URL
- **XFCE4 terminal profile** — Dark theme matching Flowzone UI, Fira Code font
- **Custom bash prompt** — Shows `[flowzone]` + git branch + change count + connection indicator
- **Panel indicator** — Genmon plugin script for status icon in XFCE4 panel
- **Autostart** — Portal opens automatically in browser on desktop login

## Prerequisites

- Node.js 18+
- E2B API key set in `.env` (in project root)

## Building the Development Image

```bash
npx tsx build-dev.ts
```

Builds a sandbox with alias `flowzone-desktop-dev` (8 CPU, 8192MB RAM).

## Building the Production Image

```bash
npx tsx build.ts
```

Builds a sandbox with alias `flowzone-desktop-dev` (8 CPU, 8192MB RAM).

## Template Files

Configuration files in the `files/` directory are copied into the sandbox during build:

| File | Destination |
|------|-------------|
| `flowzone-bridge.sh` | `/usr/local/bin/flowzone-bridge` |
| `opencode-plugins/flowzone-bridge.ts` | `/home/user/.config/opencode/plugins/flowzone-bridge.ts` |
| `startup.sh` | `/home/user/.flowzone-portal/startup.sh` |
| `portal/index.html` | `/home/user/.flowzone-portal/index.html` |
| `portal/update-status.sh` | `/home/user/.flowzone-portal/update-status.sh` |
| `gitconfig` | `/home/user/.gitconfig` |
| `opencode-config.json` | `/home/user/.config/opencode/config.json` |
| `vscode-settings.json` | `/home/user/.config/Code/User/settings.json` |
| `xfce4-desktop.xml` | XFCE desktop config |
| `screensaver.desktop` | Autostart screensaver |
| `autostart/flowzone-portal.desktop` | Autostart portal |
| `google-chrome.desktop` | Chrome desktop entry |
| `flowzone-portal.desktop` | Portal desktop entry |
| `wallpaper.png` | Desktop wallpaper |
| `notifications/flowzone-notify.sh` | `/usr/local/bin/flowzone-notify` |
| `terminal/flowzone-bashrc.sh` | `/home/user/.flowzone-bashrc` |
| `terminal/terminalrc` | Terminal profile (via startup.sh) |
| `thunar/uca.xml` | Thunar custom actions (via startup.sh) |
| `panel/flowzone-indicator.py` | Genmon panel indicator |
| `panel/setup-indicator.sh` | Panel setup script |

## Environment Variables

The following env vars can be injected at sandbox creation time and are consumed by `startup.sh`:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Anthropic provider config |
| `ANTHROPIC_MODEL` | Anthropic model override |
| `OPENAI_API_KEY` | OpenAI provider config |
| `OPENAI_MODEL` | OpenAI model override |
| `GOOGLE_API_KEY` | Google provider config |
| `GOOGLE_MODEL` | Google model override |
| `MISTRAL_API_KEY` | Mistral provider config |
| `MISTRAL_MODEL` | Mistral model override |
| `DEEPSEEK_API_KEY` | DeepSeek provider config |
| `DEEPSEEK_MODEL` | DeepSeek model override |
| `GROQ_API_KEY` | Groq provider config |
| `GROQ_MODEL` | Groq model override |
| `FLOWZONE_API_URL` | Flowzone platform API URL |
| `FLOWZONE_CHAT_ID` | Active chat ID for bridge |
| `FLOWZONE_PROJECT_ID` | Project ID for bridge |
| `GITHUB_TOKEN` | GitHub auth for git push |
| `GIT_AUTHOR_NAME` | Git user name |
| `GIT_AUTHOR_EMAIL` | Git user email |
| `OPENCODE_AGENT_NAME` | OpenCode agent name |
| `OPENCODE_WORK_DIR` | OpenCode working directory |
| `OPENCODE_MAX_ITERATIONS` | Max agent iterations |
