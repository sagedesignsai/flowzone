import { Template, waitForPort } from "e2b"

export const flowzoneTemplate = Template()
  .fromUbuntuImage("22.04")
  .setUser("root")
  // Desktop environment + dev tools
  .runCmd([
    "apt-get update",
    "DEBIAN_FRONTEND=noninteractive apt-get install -y \
      xvfb x11-utils xauth xfce4 xfce4-goodies x11vnc xdotool \
      net-tools procps curl wget git python3 python3-pip python3-venv \
      nodejs npm jq ripgrep fzf make gcc g++ unzip xz-utils tmux \
      gh fonts-noto fonts-noto-color-emoji fonts-firacode sudo",
    "DEBIAN_FRONTEND=noninteractive npm install -g pnpm",
    "DEBIAN_FRONTEND=noninteractive apt-get clean",
    "apt-get clean && rm -rf /var/lib/apt/lists/*",
  ])
  // Go
  .runCmd([
    "curl -fsSL https://go.dev/dl/go1.22.3.linux-amd64.tar.gz -o /tmp/go.tar.gz",
    "rm -rf /usr/local/go && tar -C /usr/local -xzf /tmp/go.tar.gz",
    `echo 'export PATH=$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh`,
    "chmod +x /etc/profile.d/go.sh",
  ])
  // Rust (as user so rustup installs to ~/.rustup)
  .runCmd([
    "su user -c 'curl --proto =https --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'",
    `echo 'export PATH=$PATH:$HOME/.cargo/bin' > /etc/profile.d/rust.sh`,
    "chmod +x /etc/profile.d/rust.sh",
  ])
  // OpenCode CLI
  .runCmd([
    "OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash",
  ])
  // noVNC
  .runCmd([
    "git clone --branch e2b-desktop https://github.com/e2b-dev/noVNC.git /opt/noVNC",
    "ln -s /opt/noVNC/vnc.html /opt/noVNC/index.html",
    "git clone --branch v0.12.0 https://github.com/novnc/websockify /opt/noVNC/utils/websockify",
  ])
  // Ensure required directories exist
  .makeDir("/home/user/.config/Code/User")
  .makeDir("/home/user/.config/opencode")
  .makeDir("/home/user/.config/opencode/plugins")
  .makeDir("/home/user/.config/xfce4/xfconf/xfce-perchannel-xml/")
  .makeDir("/home/user/.config/autostart")
  .makeDir("/home/user/.config/Thunar")
  .makeDir("/home/user/.config/xfce4/terminal")
  .makeDir("/home/user/.ssh")
  .makeDir("/home/user/.flowzone-portal")
  .makeDir("/home/user/.flowzone-portal/indicator")
  .makeDir("/home/user/.flowzone-portal/thunar")
  .makeDir("/home/user/.flowzone-portal/terminal")
  // Copy configuration files
  .copy("files/flowzone-bridge.sh", "/usr/local/bin/flowzone-bridge")
  .copy(
    "files/opencode-plugins/flowzone-bridge.ts",
    "/home/user/.config/opencode/plugins/flowzone-bridge.ts",
  )
  .copy("files/startup.sh", "/home/user/.flowzone-portal/startup.sh")
  .copy("files/portal/index.html", "/home/user/.flowzone-portal/index.html")
  .copy(
    "files/portal/update-status.sh",
    "/home/user/.flowzone-portal/update-status.sh",
  )
  .copy("files/gitconfig", "/home/user/.gitconfig")
  .copy(
    "files/opencode-config.json",
    "/home/user/.config/opencode/config.json",
  )
  .copy(
    "files/vscode-settings.json",
    "/home/user/.config/Code/User/settings.json",
  )
  .copy(
    "files/xfce4-desktop.xml",
    "/home/user/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml",
  )
  .copy(
    "files/screensaver.desktop",
    "/home/user/.config/autostart/screensaver.desktop",
  )
  .copy(
    "files/autostart/flowzone-portal.desktop",
    "/home/user/.config/autostart/flowzone-portal.desktop",
  )
  .copy(
    "files/google-chrome.desktop",
    "/usr/share/applications/google-chrome.desktop",
  )
  .copy(
    "files/flowzone-portal.desktop",
    "/usr/share/applications/flowzone-portal.desktop",
  )
  .copy("files/wallpaper.jpg", "/usr/share/backgrounds/xfce/wallpaper.jpg")
  // Notifications
  .copy(
    "files/notifications/flowzone-notify.sh",
    "/usr/local/bin/flowzone-notify",
  )
  // Terminal bashrc extensions
  .copy(
    "files/terminal/flowzone-bashrc.sh",
    "/home/user/.flowzone-bashrc",
  )
  // Terminal profile (distributed by startup.sh)
  .copy(
    "files/terminal/terminalrc",
    "/home/user/.flowzone-portal/terminal/terminalrc",
  )
  // Thunar custom actions (distributed by startup.sh)
  .copy(
    "files/thunar/uca.xml",
    "/home/user/.flowzone-portal/thunar/uca.xml",
  )
  // Panel indicator
  .copy(
    "files/panel/flowzone-indicator.py",
    "/home/user/.flowzone-portal/indicator/flowzone-indicator.py",
  )
  .copy(
    "files/panel/setup-indicator.sh",
    "/home/user/.flowzone-portal/indicator/setup-indicator.sh",
  )
  // Make executables
  .runCmd([
    "chmod +x /usr/local/bin/flowzone-bridge",
    "chmod +x /home/user/.flowzone-portal/startup.sh",
    "chmod +x /home/user/.flowzone-portal/update-status.sh",
    "chmod +x /usr/local/bin/flowzone-notify",
    "chmod +x /home/user/.flowzone-portal/indicator/setup-indicator.sh",
  ])
  // Startup command — handles Xvfb, XFCE4, x11vnc, noVNC, then calls startup.sh
  .copy("files/start-command.sh", "/home/user/start-command.sh")
  .runCmd("chmod +x /home/user/start-command.sh")
  .setUser("user")
  .setWorkdir("/home/user")
  .setStartCmd("/home/user/start-command.sh", waitForPort(6080))
