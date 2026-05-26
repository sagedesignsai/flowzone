import { config } from "dotenv"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { Template, defaultBuildLogger } from "e2b"
import { flowzoneTemplate } from "./template.ts"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env from project root
config({ path: resolve(__dirname, "../../.env") })

async function build() {
  console.log("Building flowzone-desktop-dev template...")
  await Template.build(flowzoneTemplate, "flowzone-desktop-dev", {
    cpuCount: 8,
    memoryMB: 8192,
    onBuildLogs: defaultBuildLogger(),
  })
  console.log("Build complete.")
}

build().catch((err) => {
  console.error("Build failed:", err)
  process.exit(1)
})
