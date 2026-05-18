from e2b import CopyItem, Template

template = (
    Template(file_context_path="files")
    .from_template("desktop")
    # Install OpenCode CLI, Node.js 22, pnpm, and GitHub CLI
    .run_cmd(
        [
            # Install OpenCode CLI to /usr/local/bin (system-wide)
            "OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash",
            # Install Node.js 22 via NodeSource
            "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
            "apt-get install -y nodejs",
            # Install pnpm globally
            "npm install -g pnpm",
            # Install GitHub CLI
            "apt-get install -y gh",
        ],
    )
    # Configure git
    .run_cmd(
        [
            "git config --system core.editor 'nano'",
            "git config --system pull.rebase false",
            "git config --system init.defaultBranch main",
        ],
    )
    # Ensure required directories exist
    .make_dir("/home/user/.config/Code/User")
    .make_dir("/home/user/.config/opencode")
    .make_dir("/home/user/.config/xfce4/xfconf/xfce-perchannel-xml/")
    .make_dir("/home/user/.config/autostart")
    .make_dir("/home/user/.ssh")
    # Copy configuration files
    .copy_items(
        [
            CopyItem(
                src="flowzone-bridge.sh",
                dest="/usr/local/bin/flowzone-bridge",
            ),
            CopyItem(
                src="gitconfig",
                dest="/home/user/.gitconfig",
            ),
            CopyItem(
                src="opencode-config.json",
                dest="/home/user/.config/opencode/config.json",
            ),
            CopyItem(
                src="vscode-settings.json",
                dest="/home/user/.config/Code/User/settings.json",
            ),
            CopyItem(
                src="xfce4-desktop.xml",
                dest="/home/user/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml",
            ),
            CopyItem(
                src="screensaver.desktop",
                dest="/home/user/.config/autostart/screensaver.desktop",
            ),
            CopyItem(
                src="google-chrome.desktop",
                dest="/usr/share/applications/google-chrome.desktop",
            ),
            CopyItem(
                src="wallpaper.png",
                dest="/usr/share/backgrounds/xfce/wallpaper.png",
            ),
        ]
    )
    # Make flowzone-bridge executable
    .run_cmd("chmod +x /usr/local/bin/flowzone-bridge")
)

# Template with user and workdir set
template_with_user_workdir = template.set_user("user").set_workdir("/home/user")
