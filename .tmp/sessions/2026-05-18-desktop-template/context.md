# Task Context: Flowzone Desktop Template

Session ID: 2026-05-18-desktop-template
Created: 2026-05-18T12:00:00Z
Status: in_progress

## Current Request
Build a custom E2B desktop sandbox template pre-configured for Flowzone's AI coding workflow. The template extends E2B's base `desktop` template and adds OpenCode CLI, Node.js/pnpm, GitHub CLI, git configuration, Flowzone branding, and a pipeline bridge script.

## Context Files (Standards to Follow)
- `.opencode/context/core/standards/code-quality.md` — Code style standards
- `.opencode/context/core/standards/security-patterns.md` — Security best practices (env vars, file safety)
- `.opencode/context/core/standards/documentation.md` — Documentation standards
- `.opencode/context/core/workflows/feature-breakdown.md` — Feature planning structure

## Reference Files (Source Material to Look At)
- `reference-repos/desktop/template/` — E2B desktop template (base reference)
- `reference-repos/desktop/template/template.py` — Template definition pattern
- `reference-repos/desktop/template/build_prod.py` — Build script pattern
- `reference-repos/desktop/template/files/` — Config file examples
- `app/api/desktop/route.ts` — Current desktop API route (needs template param)
- `.env.example` — Env var reference (needs additions)
- `lib/tools/desktop/opencode.ts` — OpenCode tool (assumes opencode CLI installed)
- `lib/tools/desktop/sandbox-context.ts` — Desktop sandbox context pattern

## External Docs Fetched
- OpenCode CLI: `curl -fsSL https://opencode.ai/install | bash` (primary), `npm install -g opencode-ai` (fallback)
- E2B Template SDK: `Template.from_template("desktop")` to extend existing template
- E2B Desktop SDK: `Sandbox.create("template-name", { envs, timeoutMs, metadata, resolution, dpi })`
- E2B Sandbox env vars: `E2B_SANDBOX`, `E2B_SANDBOX_ID`, `E2B_TEAM_ID`, `E2B_TEMPLATE_ID` auto-injected

## Components
1. Template build system (template.py, build scripts, pyproject.toml, README)
2. Config files (bridge script, gitconfig, opencode config, VS Code settings, XFCE config, Chrome desktop, screensaver)
3. Wallpaper placeholder
4. API route update (template param + envs + metadata)
5. .env.example update

## Constraints
- Extend E2B's "desktop" template (don't rebuild from ubuntu:22.04)
- OpenCode installed via curl script (primary), npm as fallback
- Template name: "flowzone-desktop" (prod), "flowzone-desktop-dev" (dev)
- Resources: 8 CPU, 8GB RAM
- No semicolons, double quotes in TS files (Prettier config)
- Python files follow existing template patterns from reference-repos

## Exit Criteria
- [ ] All 13 template files created in `template/flowzone-desktop/`
- [ ] `app/api/desktop/route.ts` updated with template param + envs + metadata
- [ ] `.env.example` updated with E2B_DESKTOP_TEMPLATE and NEXT_PUBLIC_URL
- [ ] Template builds successfully with `poetry run python build_prod.py`
