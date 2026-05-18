import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, image } = body

  if (!name || typeof name !== "string") {
    return NextResponse.json({ message: "Name is required" }, { status: 400 })
  }

  try {
    await auth.api.updateUser({
      body: {
        name,
        image: image || undefined,
      },
      headers: await headers(),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update profile"
    return NextResponse.json({ message }, { status: 500 })
  }
}
