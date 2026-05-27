#!/bin/bash
#
# Flowzone Desktop Sandbox Startup Script
#
# Runs once on sandbox creation. Generates dynamic OpenCode config
# from environment variables, sets up git credentials, and starts the
# desktop portal.
#
# Environment variables (injected at sandbox creation):
#   ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY, etc.
#   FLOWZONE_API_URL, FLOWZONE_CHAT_ID, FLOWZONE_PROJECT_ID
#   GITHUB_TOKEN, GIT_AUTHOR_NAME, GIT_AUTHOR_EMAIL
#

set -euo pipefail

log() {
  echo "[flowzone-startup] $*"
}

CONFIG_DIR="/home/user/.config/opencode"
CONFIG_FILE="${CONFIG_DIR}/config.json"

mkdir -p "$CONFIG_DIR"

# ── Generate OpenCode config from env vars ──────────────────
# Prioritize available AI provider API keys and write a dynamic config.
log "Generating OpenCode config from environment..."

# Determine available providers
PROVIDERS="[]"

if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  PROVIDERS=$(echo "$PROVIDERS" | python3 -c "
import json, sys
providers = json.load(sys.stdin)
providers.append({
  \"name\": \"anthropic\",
  \"model\": \"${ANTHROPIC_MODEL:-claude-sonnet-4-20250514}\",
  \"apiKey\": \"\${ANTHROPIC_API_KEY}\"
})
print(json.dumps(providers))
")
fi

if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  PROVIDERS=$(echo "$PROVIDERS" | python3 -c "
import json, sys
providers = json.load(sys.stdin)
providers.append({
  \"name\": \"openai\",
  \"model\": \"${OPENAI_MODEL:-gpt-4o}\",
  \"apiKey\": \"\${OPENAI_API_KEY}\"
})
print(json.dumps(providers))
")
fi

if [[ -n "${GOOGLE_API_KEY:-}" ]]; then
  PROVIDERS=$(echo "$PROVIDERS" | python3 -c "
import json, sys
providers = json.load(sys.stdin)
providers.append({
  \"name\": \"google\",
  \"model\": \"${GOOGLE_MODEL:-gemini-2.0-flash-001}\",
  \"apiKey\": \"\${GOOGLE_API_KEY}\"
})
print(json.dumps(providers))
")
fi

if [[ -n "${MISTRAL_API_KEY:-}" ]]; then
  PROVIDERS=$(echo "$PROVIDERS" | python3 -c "
import json, sys
providers = json.load(sys.stdin)
providers.append({
  \"name\": \"mistral\",
  \"model\": \"${MISTRAL_MODEL:-mistral-large-latest}\",
  \"apiKey\": \"\${MISTRAL_API_KEY}\"
})
print(json.dumps(providers))
")
fi

if [[ -n "${DEEPSEEK_API_KEY:-}" ]]; then
  PROVIDERS=$(echo "$PROVIDERS" | python3 -c "
import json, sys
providers = json.load(sys.stdin)
providers.append({
  \"name\": \"deepseek\",
  \"model\": \"${DEEPSEEK_MODEL:-deepseek-chat}\",
  \"apiKey\": \"\${DEEPSEEK_API_KEY}\"
})
print(json.dumps(providers))
")
fi

if [[ -n "${GROQ_API_KEY:-}" ]]; then
  PROVIDERS=$(echo "$PROVIDERS" | python3 -c "
import json, sys
providers = json.load(sys.stdin)
providers.append({
  \"name\": \"groq\",
  \"model\": \"${GROQ_MODEL:-llama-3.3-70b-versatile}\",
  \"apiKey\": \"\${GROQ_API_KEY}\"
})
print(json.dumps(providers))
")
fi

python3 -c "
import json, sys

config = {
  \"provider\": {
    \"providers\": json.loads('''${PROVIDERS}'''),
    \"fallback\": True
  },
  \"permissions\": {
    \"file\": {
      \"read\": [\"**/*\"],
      \"write\": [\"**/*\"],
      \"deny\": []
    },
    \"command\": {
      \"allow\": [
        \"pnpm\", \"npm\", \"npx\", \"git\", \"ls\", \"cat\",
        \"mkdir\", \"rm\", \"cp\", \"mv\", \"python3\", \"go\",
        \"cargo\", \"rustc\", \"gh\", \"code\", \"jq\", \"rg\",
        \"fzf\", \"curl\", \"wget\", \"tar\", \"gzip\", \"make\"
      ],
      \"deny\": [\"sudo.*\", \"rm -rf /\", \"chmod 777.*\"]
    }
  },
  \"agent\": {
    \"name\": \"${OPENCODE_AGENT_NAME:-flowzone-desktop}\",
    \"working_directory\": \"${OPENCODE_WORK_DIR:-/home/user/project}\",
    \"max_iterations\": ${OPENCODE_MAX_ITERATIONS:-50}
  },
  \"autoupdate\": \"notify\",
  \"telemetry\": \"off\"
}

with open('${CONFIG_FILE}', 'w') as f:
  json.dump(config, f, indent=2)
"

log "OpenCode config written to ${CONFIG_FILE}"

# ── Configure git identity ───────────────────────────────────
if [[ -n "${GIT_AUTHOR_NAME:-}" ]]; then
  git config --global user.name "$GIT_AUTHOR_NAME"
fi
if [[ -n "${GIT_AUTHOR_EMAIL:-}" ]]; then
  git config --global user.email "$GIT_AUTHOR_EMAIL"
fi

# ── Set up GitHub CLI auth if token present ──────────────────
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  echo "$GITHUB_TOKEN" | gh auth login --with-token 2>/dev/null || true
fi

# ── Start desktop portal ─────────────────────────────────────
PORTAL_DIR="/home/user/.flowzone-portal"
if [[ -f "${PORTAL_DIR}/index.html" ]]; then
  log "Starting desktop portal..."
  nohup python3 -m http.server 9090 --directory "$PORTAL_DIR" \
    > /tmp/flowzone-portal.log 2>&1 &
  log "Desktop portal running on http://localhost:9090"
fi

# ── Start status watchdog ────────────────────────────────────
if [[ -f "${PORTAL_DIR}/update-status.sh" ]]; then
  nohup bash "${PORTAL_DIR}/update-status.sh" \
    > /tmp/flowzone-watchdog.log 2>&1 &
  log "Status watchdog started (updates every 15s)"
fi

# ── Source bashrc extensions into .bashrc ────────────────────
BASHRC_EXT="/home/user/.flowzone-bashrc"
if [[ -f "$BASHRC_EXT" ]]; then
  if ! grep -q "flowzone-bashrc" /home/user/.bashrc 2>/dev/null; then
    echo -e "\n# Flowzone bash extensions\nsource $BASHRC_EXT" >> /home/user/.bashrc
    log "Bashrc extensions sourced"
  fi
fi

# ── Set up XFCE4 keyboard shortcuts ─────────────────────────
log "Setting up XFCE4 keyboard shortcuts..."
# Push changes: Ctrl+Alt+P
xfconf-query -c xfce4-keyboard-shortcuts -p "/commands/custom/<Primary><Alt>p" \
  -n -t string -s "flowzone-bridge push-changes 'Auto-commit'" 2>/dev/null || true
# Open portal: Ctrl+Alt+S
xfconf-query -c xfce4-keyboard-shortcuts -p "/commands/custom/<Primary><Alt>s" \
  -n -t string -s "x-www-browser http://localhost:9090" 2>/dev/null || true
# Open terminal: Ctrl+Alt+T (override default)
xfconf-query -c xfce4-keyboard-shortcuts -p "/commands/custom/<Primary><Alt>t" \
  -n -t string -s "exo-open --launch TerminalEmulator" 2>/dev/null || true

# ── Set up Thunar custom actions ─────────────────────────────
THUNAR_CONFIG="/home/user/.config/Thunar"
if [[ -f "${PORTAL_DIR}/thunar/uca.xml" ]]; then
  mkdir -p "$THUNAR_CONFIG"
  cp "${PORTAL_DIR}/thunar/uca.xml" "${THUNAR_CONFIG}/uca.xml"
  log "Thunar custom actions installed"
fi

# ── Set up XFCE4 terminal profile ───────────────────────────
TERMINAL_CONFIG="/home/user/.config/xfce4/terminal"
if [[ -f "${PORTAL_DIR}/terminal/terminalrc" ]]; then
  mkdir -p "$TERMINAL_CONFIG"
  cp "${PORTAL_DIR}/terminal/terminalrc" "${TERMINAL_CONFIG}/terminalrc"
  log "Terminal profile installed"
fi

# ── Try to set up panel indicator (non-fatal if fails) ───────
if [[ -f "${PORTAL_DIR}/indicator/flowzone-indicator.py" ]] && command -v xfconf-query &>/dev/null; then
  bash "${PORTAL_DIR}/indicator/setup-indicator.sh" 2>/dev/null || true
fi

# ── Start persistent tmux session ────────────────────────────
if command -v tmux &>/dev/null; then
  tmux new-session -d -s flowzone-core 2>/dev/null || true
  log "Tmux session 'flowzone-core' started"
fi

# ── Send desktop notification ────────────────────────────────
if command -v notify-send &>/dev/null; then
  notify-send \
    --icon=utilities-system-monitor \
    --urgency=low \
    --app-name="Flowzone" \
    "Flowzone" "Sandbox ready — OpenCode, git, and portal configured"
fi

log "Startup complete"
