import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    // TODO: Fetch all settings from database
    return NextResponse.json({
      success: true,
      settings: {
        template: null,
        analyticsProvider: null,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings"
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { template, analyticsProvider } = body

    // TODO: Save settings to database
    return NextResponse.json({
      success: true,
      settings: {
        template,
        analyticsProvider,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update settings"
    return NextResponse.json({ message }, { status: 500 })
  }
}
