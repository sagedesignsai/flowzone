import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, "../../.env") })

async function main() {
  console.log("=== Step 1: Create base sandbox ===")
  const { Sandbox: BaseSandbox } = await import("e2b")
  const raw = await BaseSandbox.create("flowzone-desktop-dev", {
    timeoutMs: 300_000,
    envs: {
      FLOWZONE_API_URL: "http://localhost:3000",
      FLOWZONE_CHAT_ID: "test",
      FLOWZONE_PROJECT_ID: "",
      GIT_AUTHOR_NAME: "test",
      GIT_AUTHOR_EMAIL: "test@test.com",
    },
    metadata: { userId: "test", projectId: "", chatId: "test" },
  })
  console.log(`Sandbox created: ${raw.sandboxId}`)

  console.log("\n=== Step 2: Wait for envd ===")
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    try {
      await raw.commands.run("echo envd-ready", { timeoutMs: 10_000 })
      console.log("envd is ready")
      break
    } catch (err) {
      console.log("waiting for envd...")
      await new Promise((r) => setTimeout(r, 2_000))
    }
  }

  console.log("\n=== Step 3: Connect via @e2b/desktop Sandbox ===")
  const { Sandbox } = await import("@e2b/desktop")
  const desktop = await Sandbox.connect(raw.sandboxId, {
    apiKey: process.env.E2B_API_KEY,
    requestTimeoutMs: 300_000,
  })

  console.log("\n=== Step 4: Diagnostics ===")
  const diag = await desktop.commands.run(
    "echo '--- PATH ---'; echo $PATH; echo '--- Xvfb ---'; command -v Xvfb 2>&1 || echo 'MISSING'; echo '--- xdpyinfo ---'; command -v xdpyinfo 2>&1 || echo 'MISSING'; echo '--- x11vnc ---'; command -v x11vnc 2>&1 || echo 'MISSING'; echo '--- startxfce4 ---'; command -v startxfce4 2>&1 || echo 'MISSING'; echo '--- noVNC ---'; test -f /opt/noVNC/utils/novnc_proxy && echo 'FOUND' || echo 'MISSING'; echo '--- DISPLAY ---'; echo ${DISPLAY:-unset}",
    { timeoutMs: 15_000 },
  )
  console.log("Diagnostics output:", diag.stdout)

  console.log("\n=== Step 5: Start Xvfb + XFCE4 via _start ===")
  await desktop._start(":0", { resolution: [1280, 800], dpi: 96 })
  console.log("Desktop started")

  console.log("\n=== Step 6: Start VNC + noVNC ===")
  await desktop.stream.start()
  const vncUrl = desktop.stream.getUrl()
  console.log(`VNC URL: ${vncUrl}`)

  console.log("\n=== ALL GOOD! Cleaning up ===")
  await desktop.kill()
  console.log("Done")
}

main().catch((err) => {
  console.error("FAILED:", err)
  process.exit(1)
})
