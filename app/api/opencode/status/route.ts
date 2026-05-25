export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { chatId, status, message } = body

    if (!chatId || !status) {
      return Response.json(
        { error: "chatId and status are required" },
        { status: 400 }
      )
    }

    console.log(
      `[opencode-status] chat=${chatId} status=${status} msg=${message ?? ""}`
    )

    return Response.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/opencode/status error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
