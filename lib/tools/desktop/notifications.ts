/**
 * Desktop Notification Tool
 *
 * Sends XFCE4 desktop notifications inside the VNC sandbox.
 * Uses `notify-send` via the @e2b/desktop connection.
 * Only available when a desktop sandbox is attached.
 */

import { tool } from "ai"
import { z } from "zod"
import {
  DesktopSandboxContext,
  requireDesktop,
} from "@/lib/tools/desktop/sandbox-context"

const NOTIFY_ICONS: Record<string, string> = {
  info: "utilities-system-monitor",
  success: "emblem-default",
  warning: "dialog-warning",
  error: "dialog-error",
}

export const sendNotification = tool({
  description:
    "Send a desktop notification inside the sandbox. " +
    "Use this to alert the user about task completion, build results, " +
    "errors, or when waiting for input. Notifications appear as pop-ups " +
    "in the VNC desktop environment.",
  inputSchema: z.object({
    title: z
      .string()
      .describe("Notification title (e.g. 'Build Complete', 'Error')"),
    message: z
      .string()
      .describe("Notification body text describing what happened"),
    type: z
      .enum(["info", "success", "warning", "error"])
      .optional()
      .default("info")
      .describe("Notification type — affects icon and urgency"),
  }),
  execute: async ({ title, message, type }) => {
    const ctx = DesktopSandboxContext.get()
    if (!ctx) requireDesktop("sendNotification")

    const icon = NOTIFY_ICONS[type ?? "info"]
    const urgency = type === "error" ? "critical" : "normal"

    // Escape single quotes for safe shell execution
    const safeTitle = title.replace(/'/g, "'\\''")
    const safeMessage = message.replace(/'/g, "'\\''")

    await ctx.desktop.commands.run(
      `notify-send --icon='${icon}' --urgency='${urgency}' --app-name='Flowzone' '${safeTitle}' '${safeMessage}'`,
    )

    return { success: true, type, title, message }
  },
})
