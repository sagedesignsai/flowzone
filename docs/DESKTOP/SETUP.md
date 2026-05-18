# Desktop System Setup & Configuration

Prerequisites and environment configuration for the virtual desktop system.

## Prerequisites

### Required
- **E2B Account** — Sign up at [e2b.dev](https://e2b.dev)
- **E2B API Key** — Generate from E2B dashboard
- **Node.js 18+** — For running Flowzone
- **pnpm** — Package manager

### Optional
- **AI Provider** — Anthropic, OpenAI, or other (for agent)
- **GitHub Token** — For git operations in sandbox
- **Git Config** — Author name and email

## Environment Variables

### Required

```bash
# E2B Configuration
E2B_API_KEY=your_e2b_api_key_here
```

### Optional

```bash
# Desktop Sandbox Timeout (milliseconds, default: 300000 = 5 min)
E2B_DESKTOP_TIMEOUT_MS=300000

# Flowzone API URL (for sandbox environment)
NEXT_PUBLIC_URL=http://localhost:3000

# Git Configuration
GIT_AUTHOR_NAME="Your Name"
GIT_AUTHOR_EMAIL="your.email@example.com"
GITHUB_TOKEN=your_github_token

# AI Provider Keys
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

## Installation

### 1. Get E2B API Key

1. Go to [e2b.dev](https://e2b.dev)
2. Sign up or log in
3. Navigate to API Keys
4. Create new API key
5. Copy the key

### 2. Configure Environment

Create `.env.local` in project root:

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit .env.local and add:
E2B_API_KEY=your_key_here
```

### 3. Verify Setup

```bash
# Check E2B connectivity
curl -H "Authorization: Bearer $E2B_API_KEY" https://api.e2b.dev/v1/sandboxes

# Should return: {"sandboxes":[]}
```

## Desktop Template

The `flowzone-desktop-ts` template is automatically used when creating sandboxes.

### What's Included

- **OS:** Ubuntu 22.04 LTS
- **Desktop:** XFCE4 with VNC server
- **Development Tools:**
  - Node.js 22
  - pnpm (package manager)
  - GitHub CLI
  - Git (configured)
  - VS Code
  - Google Chrome
  - Firefox
  - OpenCode CLI

### Template Location

```
template/flowzone-desktop-ts/
├── template.ts          # Template definition
├── build.ts             # Build script
└── files/
    ├── flowzone-bridge.sh        # Context management
    ├── gitconfig                 # Git configuration
    ├── opencode-config.json      # OpenCode settings
    ├── vscode-settings.json      # VS Code settings
    ├── xfce4-desktop.xml         # Desktop configuration
    ├── screensaver.desktop       # Screensaver
    ├── google-chrome.desktop     # Chrome launcher
    └── wallpaper.png             # Desktop wallpaper
```

### Customizing Template

To modify the template:

1. Edit `template/flowzone-desktop-ts/template.ts`
2. Update `files/` directory as needed
3. Rebuild: `pnpm run build:template`
4. Restart Flowzone

## Development

### Running Locally

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your E2B_API_KEY

# Start dev server
pnpm dev

# Open http://localhost:3000
```

### Testing Desktop Features

```bash
# 1. Create a new chat
# 2. Click "Launch Desktop" (once implemented)
# 3. Wait for VNC to load
# 4. Send message: "Take a screenshot"
# 5. Verify screenshot appears in chat
```

### Debugging

**Check E2B API Key:**
```bash
curl -H "Authorization: Bearer $E2B_API_KEY" \
  https://api.e2b.dev/v1/sandboxes
```

**Check Sandbox Status:**
```bash
# In browser console
fetch('/api/desktop', {
  method: 'POST',
  body: JSON.stringify({ chatId: 'test', projectId: 'test' })
}).then(r => r.json()).then(console.log)
```

**View Server Logs:**
```bash
# Terminal where pnpm dev is running
# Look for POST /api/desktop and POST /api/chat/[id]/desktop
```

## Production Deployment

### Environment Variables

Set these in your deployment platform (Vercel, AWS, etc.):

```
E2B_API_KEY=your_production_key
E2B_DESKTOP_TIMEOUT_MS=300000
NEXT_PUBLIC_URL=https://your-domain.com
GIT_AUTHOR_NAME=Flowzone
GIT_AUTHOR_EMAIL=noreply@flowzone.dev
GITHUB_TOKEN=your_github_token
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
```

### Vercel Deployment

1. Connect GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy

```bash
# Or deploy via CLI
vercel env add E2B_API_KEY
vercel deploy
```

### Docker Deployment

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

ENV E2B_API_KEY=$E2B_API_KEY
ENV NEXT_PUBLIC_URL=https://your-domain.com

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

## Troubleshooting

### E2B API Key Not Working

**Error:** `E2B_API_KEY is not configured`

**Solution:**
1. Verify key is set: `echo $E2B_API_KEY`
2. Check key is valid: `curl -H "Authorization: Bearer $E2B_API_KEY" https://api.e2b.dev/v1/sandboxes`
3. Restart dev server after changing `.env.local`

### Sandbox Creation Timeout

**Error:** `Sandbox creation timed out`

**Solution:**
1. Check E2B service status
2. Increase timeout: `E2B_DESKTOP_TIMEOUT_MS=600000`
3. Try again (may be temporary)

### VNC Connection Failed

**Error:** `Failed to connect to VNC stream`

**Solution:**
1. Check sandbox is running: `curl https://api.e2b.dev/v1/sandboxes/$SANDBOX_ID`
2. Check VNC URL is valid
3. Try different browser
4. Check firewall/proxy settings

### Git Operations Fail

**Error:** `fatal: not a git repository`

**Solution:**
1. Set `GIT_AUTHOR_NAME` and `GIT_AUTHOR_EMAIL`
2. Initialize repo: `git init`
3. Or clone existing repo: `git clone https://...`

### OpenCode Not Found

**Error:** `opencode: command not found`

**Solution:**
1. Verify template includes OpenCode installation
2. Check `/usr/local/bin/opencode` exists
3. Rebuild template: `pnpm run build:template`

## Performance Tuning

### Sandbox Timeout

Increase for long-running tasks:
```bash
E2B_DESKTOP_TIMEOUT_MS=900000  # 15 minutes
```

### VNC Resolution

Currently fixed at 1280×800. To change:
1. Edit `app/api/desktop/route.ts`
2. Modify `resolution: [1280, 800]`
3. Restart server

### Agent Model

Change default model in `lib/ai/models.ts`:
```typescript
export function getPrimaryModel() {
  // Change to your preferred model
  return anthropic("claude-opus-4-1")
}
```

## Monitoring

### Logs

Check server logs for:
- Sandbox creation/deletion
- Agent execution
- Tool calls
- Errors

### Metrics to Track

- Sandbox creation success rate
- Average sandbox lifetime
- Tool execution times
- Agent completion times
- Error rates

### E2B Dashboard

Monitor usage at [e2b.dev/dashboard](https://e2b.dev/dashboard):
- Active sandboxes
- Resource usage
- API calls
- Billing

## Security

### API Key Protection

- ✅ Store in `.env.local` (not in git)
- ✅ Use environment variables in production
- ✅ Rotate keys regularly
- ❌ Never commit `.env.local`
- ❌ Never expose in client-side code

### Sandbox Isolation

- Each sandbox is isolated per user
- No cross-sandbox access
- Automatic cleanup on timeout
- No persistent storage between sessions

### Network Security

- VNC URL is temporary and sandbox-specific
- All commands validated through tools
- No direct shell access from frontend
- HTTPS required in production

## Support

### Resources

- [E2B Documentation](https://docs.e2b.dev)
- [E2B Discord Community](https://discord.gg/e2b)
- [Flowzone GitHub Issues](https://github.com/flowzone/flowzone/issues)

### Getting Help

1. Check [GAPS.md](./GAPS.md) for known issues
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design
3. Check server logs for errors
4. Ask in E2B Discord or Flowzone issues
