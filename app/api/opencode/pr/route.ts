import { prisma } from "@/lib/prisma"

/**
 * POST /api/opencode/pr
 *
 * Called by the OpenCode flowzone-bridge plugin when a push completes.
 * This endpoint logs the push notification and returns — PR creation is
 * handled by the user via the BranchDialog UI.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { chatId, branch } = body

    // Resolve chat info for richer logging if chatId is provided
    let repoInfo = ""
    if (chatId) {
      try {
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { gitRepo: true },
        })
        if (chat?.gitRepo) {
          repoInfo = ` ${chat.gitRepo.owner}/${chat.gitRepo.name}:${branch || chat.gitBranch}`
        }
      } catch {
        // DB lookup is best-effort for logging
      }
    }

    console.log(`[opencode-pr] Push completed${repoInfo} chatId=${chatId}`)

    return Response.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/opencode/pr error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
