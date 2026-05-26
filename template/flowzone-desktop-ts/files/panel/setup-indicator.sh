#!/bin/bash
#
# Setup Flowzone Panel Indicator
#
# Configures XFCE4's Generic Monitor (genmon) plugin to show
# the Flowzone status indicator in the panel.
#
# This is called by startup.sh. It's idempotent — if the
# plugin is already configured, it skips.
#

set -euo pipefail

INDICATOR_SCRIPT="/home/user/.flowzone-portal/indicator/flowzone-indicator.py"
PANEL_PROP="/plugins/plugin-20"
PROPERTIES_FILE="$HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml"

# Ensure indicator script exists
if [[ ! -f "$INDICATOR_SCRIPT" ]]; then
  echo "[flowzone-panel] Indicator script not found, skipping"
  exit 0
fi

# Check if already configured
if xfconf-query -c xfce4-panel -p "${PANEL_PROP}/command" 2>/dev/null | grep -q "$INDICATOR_SCRIPT"; then
  echo "[flowzone-panel] Indicator already configured"
  exit 0
fi

echo "[flowzone-panel] Configuring panel indicator..."

# Add genmon plugin to panel (if not already present)
PLUGIN_ID=$(xfconf-query -c xfce4-panel -p /plugins -l 2>/dev/null \
  | grep "plugin-.*" | tail -1 | grep -oP '\d+' || echo "20")
PLUGIN_ID=$((PLUGIN_ID + 1))

xfconf-query -c xfce4-panel -p "/plugins/plugin-${PLUGIN_ID}" -n -t string -s "genmon" 2>/dev/null || true

# Configure genmon to run our indicator
xfconf-query -c xfce4-panel \
  -p "/plugins/plugin-${PLUGIN_ID}/command" \
  -n -t string \
  -s "python3 '${INDICATOR_SCRIPT}'" 2>/dev/null || true

xfconf-query -c xfce4-panel \
  -p "/plugins/plugin-${PLUGIN_ID}/period" \
  -n -t int \
  -s 10 2>/dev/null || true

xfconf-query -c xfce4-panel \
  -p "/plugins/plugin-${PLUGIN_ID}/use-markup" \
  -n -t bool \
  -s true 2>/dev/null || true

# Add to panel (if not already there)
# This is tricky — we need to find the right position in the panel's list of plugins
# For simplicity, we just log and let the user manually add if needed
echo "[flowzone-panel] Plugin plugin-${PLUGIN_ID} configured"
echo "[flowzone-panel] Right-click the panel → Panel → Add New Items → Generic Monitor"
echo "[flowzone-panel] Set command to: python3 ${INDICATOR_SCRIPT}"
