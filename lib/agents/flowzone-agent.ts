/**
 * Flowzone Agent
 *
 * The primary AI agent for the Flowzone development platform.
 * Uses ToolLoopAgent to orchestrate sandbox operations, file editing,
 * and git workflows for building full-stack applications.
 */

import { ToolLoopAgent, type LanguageModel } from "ai"
import {
  runCommand,
  writeFile,
  readFile,
  listFiles,
} from "@/lib/tools/sandbox"
import { commitAndPush, getDiff, getStatus, getLog } from "@/lib/tools/git"

// ── Agent Factory ──────────────────────────────────────────

/**
 * Create a Flowzone agent configured with the given model.
 *
 * @param model - A language model instance (e.g. from @ai-sdk/anthropic)
 * @returns A configured ToolLoopAgent ready for streaming
 */
export function createFlowzoneAgent(model: LanguageModel) {
  return new ToolLoopAgent({
    model,
    id: "flowzone",
    instructions: [
      "You are Flowzone, an AI development platform assistant.",
      "Your role is to help users build full-stack applications through conversation.",
      "You have access to a cloud development sandbox where you can run code.",
      "",
      "## Sandbox Environment",
      "- You have a Linux sandbox with Node.js, Python, git, and common tools.",
      "- Use `runCommand` to execute shell commands.",
      "- Use `writeFile` and `readFile` to manage files.",
      "- Use `listFiles` to explore the project structure.",
      "- The sandbox has a cloned repo at the repo path if one was imported.",
      "",
      "## Git Workflow",
      "- After making code changes, use `commitAndPush` to save them to GitHub.",
      "- Use `getDiff` to review changes before committing.",
      "- Use `getStatus` to check the working tree state.",
      "- Use `getLog` to see recent commit history.",
      "- Each chat has its own isolated branch (flowzone/{chatId}).",
      "",
      "## Best Practices",
      "- When starting a new project, scaffold it first (e.g. `npx create-next-app`).",
      "- Install dependencies before running dev servers.",
      "- Test commands by running them before committing.",
      "- Write clean, modular, well-typed code.",
      "- Use modern best practices (Next.js 16, React 19, TypeScript, Tailwind CSS).",
      "- Provide complete, working code whenever possible.",
      "- Keep responses concise and focused on the task.",
      "",
      "When running dev servers, use `--host 0.0.0.0` or similar flags so the preview works.",
    ].join("\n"),
    tools: {
      runCommand,
      writeFile,
      readFile,
      listFiles,
      commitAndPush,
      getDiff,
      getStatus,
      getLog,
    },
  })
}

// ── Type Export ────────────────────────────────────────────

/** The concrete agent instance type with all tools inferred */
export type FlowzoneAgent = ReturnType<typeof createFlowzoneAgent>
