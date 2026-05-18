/**
 * Desktop Keyboard Tools
 *
 * AI tools for keyboard input in the E2B desktop sandbox.
 * Reads desktop context from DesktopSandboxContext.
 */

import { tool } from "ai"
import { z } from "zod"
import {
  DesktopSandboxContext,
  requireDesktop,
} from "@/lib/tools/desktop/sandbox-context"

// ── Keyboard Type ──────────────────────────────────────────

export const keyboardType = tool({
  description:
    "Type text at the current cursor position. Use this to fill input fields, write code in editors, or type any text.",
  inputSchema: z.object({
    text: z.string().describe("The text to type"),
    chunkSize: z
      .number()
      .optional()
      .default(25)
      .describe("Characters per chunk (default 25)"),
    delayInMs: z
      .number()
      .optional()
      .default(75)
      .describe("Delay between chunks in ms (default 75)"),
  }),
  execute: async ({ text, chunkSize, delayInMs }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("keyboardType")
    const { desktop } = ctx

    await desktop.write(text, { chunkSize, delayInMs })

    return { success: true, length: text.length }
  },
})

// ── Keyboard Press ─────────────────────────────────────────

export const keyboardPress = tool({
  description:
    "Press a single key. Use key names like 'enter', 'escape', 'tab', 'backspace', 'space', 'up', 'down', 'left', 'right', or function keys like 'f5'.",
  inputSchema: z.object({
    key: z
      .string()
      .describe("Key name to press (e.g. 'enter', 'escape', 'tab')"),
  }),
  execute: async ({ key }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("keyboardPress")
    const { desktop } = ctx

    await desktop.press(key)

    return { success: true, key }
  },
})

// ── Keyboard Shortcut ──────────────────────────────────────

export const keyboardShortcut = tool({
  description:
    "Press a keyboard shortcut (key combination). Use this for shortcuts like Ctrl+C, Ctrl+V, Ctrl+Z, Alt+Tab, etc.",
  inputSchema: z.object({
    keys: z
      .array(z.string())
      .describe(
        "Array of keys to press simultaneously, e.g. ['ctrl', 'c'] or ['ctrl', 'shift', 'z']",
      ),
  }),
  execute: async ({ keys }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("keyboardShortcut")
    const { desktop } = ctx

    await desktop.press(keys)

    return { success: true, keys }
  },
})
