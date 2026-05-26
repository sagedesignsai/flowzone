#!/bin/bash
#
# Updates the desktop portal's status files with live env/git info.
# Runs every 15s via a watchdog loop started by startup.sh.
#

set -euo pipefail

PORTAL_DIR="/home/user/.flowzone-portal"

while true; do
  cat > "${PORTAL_DIR}/env-info.json" <<JSONEOF
{
  "flowzoneUrl": "${FLOWZONE_API_URL:-}",
  "chatId": "${FLOWZONE_CHAT_ID:-}",
  "projectId": "${FLOWZONE_PROJECT_ID:-}",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'none')",
  "remote": "$(git remote get-url origin 2>/dev/null || echo 'none')",
  "gitChanges": "$(git status --short 2>/dev/null | head -20 || echo 'none')",
  "opencodeConfig": "$([ -f /home/user/.config/opencode/config.json ] && echo 'present' || echo 'missing')"
}
JSONEOF

  git branch --show-current 2>/dev/null > "${PORTAL_DIR}/git-branch.txt" || true
  git remote get-url origin 2>/dev/null > "${PORTAL_DIR}/git-remote.txt" || true
  git status --short 2>/dev/null > "${PORTAL_DIR}/git-status.txt" || true

  sleep 15
done
