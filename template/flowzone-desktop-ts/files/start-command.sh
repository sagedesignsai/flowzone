#!/bin/bash
set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

# Start Xvfb
Xvfb "$DISPLAY" -ac -screen 0 1280x800x24 -nolisten tcp &
sleep 2

# Start XFCE4
startxfce4 &
sleep 5

# Start x11vnc
x11vnc -bg -display "$DISPLAY" -forever -wait 50 -shared -rfbport 5900 -nopw \
  -noxdamage -noxfixes -nowf -noscr -ping 1 -repeat -speeds lan 2>/tmp/x11vnc_stderr.log &
sleep 2

# Start noVNC
cd /opt/noVNC/utils
./novnc_proxy --vnc localhost:5900 --listen 6080 --web /opt/noVNC --heartbeat 15 \
  >/tmp/novnc.log 2>&1 &

sleep 2

# Run Flowzone startup (config generation, portal, etc)
if [ -f /home/user/.flowzone-portal/startup.sh ]; then
  source /home/user/.flowzone-portal/startup.sh &
fi

# Watch for opencode ready signal and open a maximized terminal on the desktop
# This connects to the same tmux session as the browser PTY terminal
(
  for i in $(seq 1 30); do
    if [ -f /tmp/opencode-ready ]; then
      DISPLAY=:0 xfce4-terminal --maximize -e "tmux attach -t flowzone-core" &
      exit 0
    fi
    sleep 2
  done
) &

# Wait forever (keep container alive)
wait
