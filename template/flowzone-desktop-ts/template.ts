import { Template } from 'e2b';

export const flowzoneTemplate = Template()
  .fromTemplate('desktop')
  // Install OpenCode CLI, Node.js 22, pnpm, and GitHub CLI
  .runCmd([
    "OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash",
    "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -",
    "sudo apt-get install -y nodejs",
    "sudo npm install -g pnpm",
    "sudo apt-get install -y gh",
  ])
  // Configure git
  .runCmd([
    "sudo git config --system core.editor 'nano'",
    "sudo git config --system pull.rebase false",
    "sudo git config --system init.defaultBranch main",
  ])
  // Ensure required directories exist
  .makeDir("/home/user/.config/Code/User")
  .makeDir("/home/user/.config/opencode")
  .makeDir("/home/user/.config/opencode/plugins")
  .makeDir("/home/user/.config/xfce4/xfconf/xfce-perchannel-xml/")
  .makeDir("/home/user/.config/autostart")
  .makeDir("/home/user/.ssh")
  // Copy configuration files
  // Note: These files should be located in a 'files' directory relative to this script
  .copy('files/flowzone-bridge.sh', '/usr/local/bin/flowzone-bridge')
  .copy('files/opencode-plugins/flowzone-bridge.ts', '/home/user/.config/opencode/plugins/flowzone-bridge.ts')
  .copy('files/gitconfig', '/home/user/.gitconfig')
  .copy('files/opencode-config.json', '/home/user/.config/opencode/config.json')
  .copy('files/vscode-settings.json', '/home/user/.config/Code/User/settings.json')
  .copy('files/xfce4-desktop.xml', '/home/user/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml')
  .copy('files/screensaver.desktop', '/home/user/.config/autostart/screensaver.desktop')
  .copy('files/google-chrome.desktop', '/usr/share/applications/google-chrome.desktop')
  .copy('files/wallpaper.png', '/usr/share/backgrounds/xfce/wallpaper.png')
  // Make flowzone-bridge executable
  .runCmd("chmod +x /usr/local/bin/flowzone-bridge")
  .setUser("user")
  .setWorkdir("/home/user");
