import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    // TODO: Fetch integrations from database
    return NextResponse.json({
      success: true,
      integrations: {},
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch integrations"
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
    const { integration, action, config } = body

    if (!integration || !action) {
      return NextResponse.json(
        { message: "Integration and action are required" },
        { status: 400 }
      )
    }

    if (action === "connect") {
      // TODO: Implement integration OAuth/webhook setup
      return NextResponse.json({
        success: true,
        integration: {
          name: integration,
          connected: true,
          config: config || {},
        },
      })
    } else if (action === "disconnect") {
      // TODO: Disconnect integration
      return NextResponse.json({
        success: true,
        integration: {
          name: integration,
          connected: false,
        },
      })
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update integration"
    return NextResponse.json({ message }, { status: 500 })
  }
}
