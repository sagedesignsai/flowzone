/**
 * Desktop Mouse Tools
 *
 * AI tools for mouse control in the E2B desktop sandbox.
 * Reads desktop context from DesktopSandboxContext.
 */

import { tool } from "ai"
import { z } from "zod"
import {
  DesktopSandboxContext,
  requireDesktop,
} from "@/lib/tools/desktop/sandbox-context"

// ── Left Click ─────────────────────────────────────────────

export const mouseLeftClick = tool({
  description:
    "Left-click at the given coordinates. Omit x/y to click at the current cursor position.",
  inputSchema: z.object({
    x: z.number().optional().describe("X coordinate"),
    y: z.number().optional().describe("Y coordinate"),
  }),
  execute: async ({ x, y }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("mouseLeftClick")
    const { desktop } = ctx

    if (x !== undefined && y !== undefined) {
      await desktop.leftClick(x, y)
    } else {
      await desktop.leftClick()
    }

    return { success: true, x, y }
  },
})

// ── Right Click ────────────────────────────────────────────

export const mouseRightClick = tool({
  description: "Right-click at the given coordinates.",
  inputSchema: z.object({
    x: z.number().optional().describe("X coordinate"),
    y: z.number().optional().describe("Y coordinate"),
  }),
  execute: async ({ x, y }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("mouseRightClick")
    const { desktop } = ctx

    if (x !== undefined && y !== undefined) {
      await desktop.rightClick(x, y)
    } else {
      await desktop.rightClick()
    }

    return { success: true, x, y }
  },
})

// ── Double Click ───────────────────────────────────────────

export const mouseDoubleClick = tool({
  description: "Double left-click at the given coordinates.",
  inputSchema: z.object({
    x: z.number().optional().describe("X coordinate"),
    y: z.number().optional().describe("Y coordinate"),
  }),
  execute: async ({ x, y }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("mouseDoubleClick")
    const { desktop } = ctx

    if (x !== undefined && y !== undefined) {
      await desktop.doubleClick(x, y)
    } else {
      await desktop.doubleClick()
    }

    return { success: true, x, y }
  },
})

// ── Scroll ─────────────────────────────────────────────────

export const mouseScroll = tool({
  description: "Scroll the mouse wheel.",
  inputSchema: z.object({
    direction: z
      .enum(["up", "down"])
      .default("down")
      .describe("Scroll direction"),
    amount: z.number().default(3).describe("Number of scroll ticks"),
  }),
  execute: async ({ direction, amount }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("mouseScroll")
    const { desktop } = ctx

    await desktop.scroll(direction, amount)

    return { success: true, direction, amount }
  },
})

// ── Move ───────────────────────────────────────────────────

export const mouseMove = tool({
  description:
    "Move the mouse cursor to the given coordinates without clicking.",
  inputSchema: z.object({
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
  }),
  execute: async ({ x, y }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("mouseMove")
    const { desktop } = ctx

    await desktop.moveMouse(x, y)

    return { success: true, x, y }
  },
})

// ── Drag ───────────────────────────────────────────────────

export const mouseDrag = tool({
  description: "Click and drag from one position to another.",
  inputSchema: z.object({
    fromX: z.number().describe("Starting X coordinate"),
    fromY: z.number().describe("Starting Y coordinate"),
    toX: z.number().describe("Ending X coordinate"),
    toY: z.number().describe("Ending Y coordinate"),
  }),
  execute: async ({ fromX, fromY, toX, toY }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("mouseDrag")
    const { desktop } = ctx

    await desktop.drag([fromX, fromY], [toX, toY])

    return { success: true, fromX, fromY, toX, toY }
  },
})
