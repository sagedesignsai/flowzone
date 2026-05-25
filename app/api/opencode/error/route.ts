export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { chatId, error } = body

    if (!chatId || !error) {
      return Response.json({ error: "chatId and error are required" }, { status: 400 })
    }

    console.error(`[opencode-error] chat=${chatId} error=${error}`)

    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/opencode/error error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
