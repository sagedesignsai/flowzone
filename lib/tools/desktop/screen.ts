/**
 * Desktop Screen Tools
 *
 * AI tools for screen capture and inspection in the E2B desktop sandbox.
 * Reads desktop context from DesktopSandboxContext.
 */

import { tool } from "ai"
import { z } from "zod"
import {
  DesktopSandboxContext,
  requireDesktop,
} from "@/lib/tools/desktop/sandbox-context"

// ── Take Screenshot ────────────────────────────────────────

export const takeScreenshot = tool({
  description:
    "Take a screenshot of the current desktop state. Returns a base64-encoded PNG image. " +
    "Use this to visually verify actions, inspect the current UI state, or check for errors before proceeding.",
  inputSchema: z.object({}),
  execute: async () => {
    const desktop = DesktopSandboxContext.get()
    if (!desktop) requireDesktop("takeScreenshot")

    const bytes = await desktop.screenshot()
    const base64 = Buffer.from(bytes).toString("base64")
    const { width, height } = await desktop.getScreenSize()
    return { screenshot: base64, mimeType: "image/png", width, height }
  },
})

// ── Get Screen Size ────────────────────────────────────────

export const getScreenSize = tool({
  description: "Get the current screen resolution of the desktop sandbox.",
  inputSchema: z.object({}),
  execute: async () => {
    const desktop = DesktopSandboxContext.get()
    if (!desktop) requireDesktop("getScreenSize")

    const size = await desktop.getScreenSize()
    return { width: size.width, height: size.height }
  },
})

// ── Get Cursor Position ────────────────────────────────────

export const getCursorPosition = tool({
  description: "Get the current mouse cursor position.",
  inputSchema: z.object({}),
  execute: async () => {
    const desktop = DesktopSandboxContext.get()
    if (!desktop) requireDesktop("getCursorPosition")

    const pos = await desktop.getCursorPosition()
    return { x: pos.x, y: pos.y }
  },
})
