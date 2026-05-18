/**
 * Desktop Application Tools
 *
 * AI tools for launching and managing applications in the E2B desktop sandbox.
 * Reads desktop context from DesktopSandboxContext.
 */

import { tool } from "ai"
import { z } from "zod"
import {
  DesktopSandboxContext,
  requireDesktop,
} from "@/lib/tools/desktop/sandbox-context"

// ── Launch App ─────────────────────────────────────────────

export const launchApp = tool({
  description:
    "Launch a desktop application by its application name. " +
    "Common values: 'google-chrome', 'firefox', 'code' (VS Code), 'xterm', 'gedit', 'thunar' (file manager). " +
    "Optionally pass a URI to open.",
  inputSchema: z.object({
    application: z
      .string()
      .describe(
        "Application name to launch (e.g. 'google-chrome', 'code', 'xterm')",
      ),
    uri: z
      .string()
      .optional()
      .describe("Optional URI or file to open with the application"),
  }),
  execute: async ({ application, uri }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("launchApp")
    const { desktop } = ctx

    await desktop.launch(application, uri)

    return { success: true, application, uri }
  },
})

// ── Open File ──────────────────────────────────────────────

export const openFile = tool({
  description:
    "Open a file or URL using the default application registered for that file type.",
  inputSchema: z.object({
    path: z.string().describe("Absolute file path or URL to open"),
  }),
  execute: async ({ path }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("openFile")
    const { desktop } = ctx

    await desktop.open(path)

    return { success: true, path }
  },
})

// ── Get Window Title ───────────────────────────────────────

export const getWindowTitle = tool({
  description:
    "Get the title of a window by its ID. " +
    "Use this to verify which application or document is currently focused.",
  inputSchema: z.object({
    windowId: z
      .string()
      .describe(
        "Window ID obtained from getCurrentWindowId or getApplicationWindows",
      ),
  }),
  execute: async ({ windowId }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("getWindowTitle")
    const { desktop } = ctx

    const title = await desktop.getWindowTitle(windowId)

    return { windowId, title }
  },
})

// ── Run Shell Command ──────────────────────────────────────

export const runShellCommand = tool({
  description:
    "Run a shell command in the desktop sandbox. " +
    "Use this to install packages, check system state, start background services, or run scripts. " +
    "For long-running processes use background: true.",
  inputSchema: z.object({
    command: z.string().describe("Shell command to execute"),
    background: z
      .boolean()
      .optional()
      .default(false)
      .describe("Run in background (non-blocking)"),
    workdir: z
      .string()
      .optional()
      .describe("Working directory for the command"),
  }),
  execute: async ({ command, background, workdir }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("runShellCommand")
    const { desktop } = ctx

    const fullCommand = workdir ? `cd ${workdir} && ${command}` : command
    const result = await desktop.commands.run(fullCommand, {
      background,
      timeoutMs: background ? 0 : undefined,
    })

    return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode }
  },
})
