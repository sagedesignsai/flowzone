#!/bin/bash
#
# Flowzone Desktop Notification Script
#
# Sends XFCE4 desktop notifications for sandbox events.
# Designed to be called from watchdog, bridge plugin, or startup scripts.
#
# Usage:
#   flowzone-notify <type> [message]
#
# Types:
#   info     - General information (default icon)
#   success  - Operation succeeded (green)
#   warning  - Something needs attention (yellow)
#   error    - Operation failed (red)
#   push     - Git push event
#   session  - OpenCode session event
#

set -euo pipefail

SCRIPT_NAME="Flowzone"

get_icon() {
  case "${1:-info}" in
    success) echo "emblem-default" ;;
    warning) echo "dialog-warning" ;;
    error)   echo "dialog-error" ;;
    push)    echo "emblem-shared" ;;
    session) echo "applications-engineering" ;;
    *)       echo "utilities-system-monitor" ;;
  esac
}

get_urgency() {
  case "${1:-info}" in
    success|push) echo "normal" ;;
    warning|session) echo "normal" ;;
    error)   echo "critical" ;;
    *)       echo "low" ;;
  esac
}

TYPE="${1:-info}"
MESSAGE="${2:-No message}"

ICON=$(get_icon "$TYPE")
URGENCY=$(get_urgency "$TYPE")

notify-send \
  --icon="$ICON" \
  --urgency="$URGENCY" \
  --app-name="Flowzone" \
  "$SCRIPT_NAME" \
  "$MESSAGE"
