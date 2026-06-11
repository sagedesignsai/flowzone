import { Template, waitForPort } from "e2b"

/**
 * Flowzone sandbox template built on E2B's pre-built `opencode` template.
 *
 * Baked in at build time:
 *   - OpenCode CLI (from the `opencode` base template)
 *   - `opencode.json` config (permission: allow, autoupdate: notify,
 *     share: disabled) — avoids runtime provisioning
 *   - OpenCode server start command + fixed password — the server is
 *     **already running** when any sandbox boots from this template
 *
 * Runtime (sandbox.ts + manager.ts):
 *   - LLM provider API keys passed as sandbox env vars
 *   - SDK client created with the baked-in password
 *
 * Build and deploy:
 *   ```bash
 *   npx tsx -e "
 *     import { template } from './templates/flowzone'
 *     const info = await Template.build(template, 'flowzone', {
 *       cpuCount: 2,
 *       memoryMB: 2048,
 *     })
 *     console.log('Built:', info)
 *   "
 *   ```
 * Then set `E2B_OPENCODE_TEMPLATE=flowzone` in your environment.
 */
export const template = Template()
  .fromTemplate("opencode")
  .setEnvs({
    OPENCODE_SERVER_PASSWORD: "opencode-fz-local",
  })
  .copy("opencode.json", "/home/user/opencode.json")
  .setStartCmd(
    "opencode serve --hostname 0.0.0.0 --port 4096",
    waitForPort(4096),
  )
