# Flowzone Desktop Template

E2B desktop sandbox template for Flowzone, extending the base desktop template with OpenCode CLI, Node.js 22, pnpm, GitHub CLI, and Flowzone bridge integration.

## Features

- **OpenCode CLI** — AI-powered development agent pre-installed
- **Node.js 22** — Latest LTS runtime with pnpm package manager
- **GitHub CLI** — `gh` for repository and PR operations
- **Flowzone Bridge** — Shell script connecting sandbox to Flowzone platform
- **Pre-configured** — Git, VS Code, and XFCE desktop settings included

## Prerequisites

- Python 3.10+
- [Poetry](https://python-poetry.org/docs/)
- E2B API key set in `.env` (see `.env.example`)

## Setup

```bash
poetry install
```

## Building the Development Image

```bash
poetry run python build_dev.py
```

Builds a sandbox with alias `flowzone-desktop-dev` (8 CPU, 8192MB RAM).

## Building the Production Image

```bash
poetry run python build_prod.py
```

Builds a sandbox with alias `flowzone-desktop` (8 CPU, 8192MB RAM).

## Template Files

Configuration files in the `files/` directory are copied into the sandbox during build:

| File | Destination |
|------|-------------|
| `flowzone-bridge.sh` | `/home/user/flowzone-bridge.sh` |
| `gitconfig` | `/home/user/.gitconfig` |
| `opencode-config.json` | `/home/user/.config/opencode/opencode.json` |
| `vscode-settings.json` | `/home/user/.config/Code/User/settings.json` |
| `xfce4-desktop.xml` | XFCE desktop config |
| `screensaver.desktop` | Autostart screensaver |
| `google-chrome.desktop` | Chrome desktop entry |
| `wallpaper.png` | Desktop wallpaper |
