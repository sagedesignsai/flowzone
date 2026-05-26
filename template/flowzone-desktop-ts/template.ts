import { Template } from "e2b"

export const flowzoneTemplate = Template()
  .fromTemplate("desktop")
  .setUser("root")
  // Install OpenCode CLI, Node.js 22, pnpm, and GitHub CLI
  .runCmd([
    "OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash",
    "curl -fsSL https://deb.nodesource.com/setup_22.x | bash",
    "apt-get install -y nodejs",
    "npm install -g pnpm",
    "apt-get install -y gh",
  ])
  // Fix root bashrc and install Python 3, Go, Rust, fonts, and common CLI tools
  .runCmd([
    // Reset bashrc to avoid PATH breakage from OpenCode installer
    `printf '%s\\n' 'export PATH=\"/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\"' 'test -f ~/.bash_aliases && . ~/.bash_aliases' > /root/.bashrc`,
    "apt-get install -y python3 python3-pip python3-venv",
    "curl -fsSL https://go.dev/dl/go1.22.3.linux-amd64.tar.gz -o /tmp/go.tar.gz",
    "rm -rf /usr/local/go && tar -C /usr/local -xzf /tmp/go.tar.gz",
    `echo 'export PATH=\\$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh`,
    "chmod +x /etc/profile.d/go.sh",
    "su user -c 'curl --proto =https --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y'",
    `echo 'export PATH=\\$PATH:\\$HOME/.cargo/bin' > /etc/profile.d/rust.sh`,
    "chmod +x /etc/profile.d/rust.sh",
    "apt-get install -y jq ripgrep fzf make gcc g++ unzip xz-utils",
    "apt-get install -y fonts-noto fonts-noto-cjk fonts-noto-color-emoji fonts-firacode",
    "git config --global core.editor nano",
    "git config --global pull.rebase false",
    "git config --global init.defaultBranch main",
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
  .setUser("user")
  .setWorkdir("/home/user")
