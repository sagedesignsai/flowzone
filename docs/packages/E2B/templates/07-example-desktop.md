# Examples: Desktop

## Overview
Sandbox with Ubuntu Desktop and VNC access for graphical user interface interactions.

## Features

- **Ubuntu 22.04** with XFCE desktop environment
- **VNC streaming** via noVNC for browser-based access
- **Pre-installed applications**: LibreOffice, text editors, file manager, utilities
- **Automation tools**: xdotool and scrot for programmatic desktop control

## Template Definition

```typescript
// template.ts
import { Template, waitForPort } from 'e2b';

export const template = Template()
  .fromUbuntuImage('22.04')
  // Desktop environment and system utilities
  .runCmd([
    'yes | unminimize',
    'apt-get update',
    'apt-get install -y \\
      xserver-xorg \\
      xorg \\
      x11-xserver-utils \\
      xvfb \\
      x11-utils \\
      xauth \\
      xfce4 \\
      xfce4-goodies \\
      util-linux \\
      sudo \\
      curl \\
      git \\
      wget \\
      python3-pip \\
      xdotool \\
      scrot \\
      ffmpeg \\
      x11vnc \\
      net-tools \\
      netcat \\
      x11-apps \\
      libreoffice \\
      xpdf \\
      gedit \\
      xpaint \\
      tint2 \\
      galculator \\
      pcmanfm',
    'apt-get clean',
    'rm -rf /var/lib/apt/lists/*',
  ])
  // Streaming server setup
  .runCmd([
    'git clone --branch e2b-desktop https://github.com/e2b-dev/noVNC.git /opt/noVNC',
    'ln -s /opt/noVNC/vnc.html /opt/noVNC/index.html',
    'git clone --branch v0.12.0 https://github.com/novnc/websockify /opt/noVNC/utils/websockify',
  ])
  // Set default terminal
  .runCmd('ln -sf /usr/bin/xfce4-terminal.wrapper /etc/alternatives/x-terminal-emulator')
  .copy('start_command.sh', '/start_command.sh')
  .runCmd('chmod +x /start_command.sh')
  .setStartCmd('/start_command.sh', waitForPort(6080));
```

## Startup Script

```bash
#!/bin/bash

# Set display
export DISPLAY=${DISPLAY:-:0}

# Start Xvfb
Xvfb $DISPLAY -ac -screen 0 1024x768x24 -nolisten tcp &
sleep 2

# Start XFCE session
startxfce4 &
sleep 5

# Start VNC server
x11vnc -bg -display $DISPLAY -forever -wait 50 -shared -rfbport 5900 -nopw \
  -noxdamage -noxfixes -nowf -noscr -ping 1 -repeat -speeds lan &
sleep 2

# Start noVNC server
cd /opt/noVNC/utils && ./novnc_proxy --vnc localhost:5900 --listen 6080 --web /opt/noVNC --heartbeat 30 &
sleep 2
```

## Build Script

```typescript
// build.ts
import { Template, defaultBuildLogger } from 'e2b';
import { template as desktopTemplate } from './template';

await Template.build(desktopTemplate, 'desktop', {
  cpuCount: 8,
  memoryMB: 8192,
  onBuildLogs: defaultBuildLogger(),
});
```

## Access Desktop

Once the sandbox is running, access the desktop via:
- **URL**: http://localhost:6080
- **Port**: 6080 (noVNC web interface)
- **VNC Port**: 5900 (direct VNC connection)

## Use Cases

1. GUI automation testing
2. Visual regression testing
3. Desktop application testing
4. Screenshot capture
5. User interaction simulation
6. Cross-platform testing

## Performance Considerations

- Allocate 8 CPU cores and 8GB memory for optimal performance
- Build process takes several minutes due to package size
- VNC streaming may require additional bandwidth
- Consider resource constraints for production use

## Automation Tools

- **xdotool**: Simulate keyboard and mouse input
- **scrot**: Capture screenshots
- **ffmpeg**: Record video of desktop activity
