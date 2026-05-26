export const DESKTOP_SANDBOX_MIME = "application/x-desktop-sandbox" as const

export type DesktopSandboxAttachment = {
  type: "custom"
  mimeType: typeof DESKTOP_SANDBOX_MIME
  data: { sandboxId: string; chatId: string }
}

export function createDesktopSandboxAttachment(
  sandboxId: string,
  chatId: string,
): DesktopSandboxAttachment {
  return {
    type: "custom",
    mimeType: DESKTOP_SANDBOX_MIME,
    data: { sandboxId, chatId },
  }
}
