import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    // TODO: Fetch env vars from database
    return NextResponse.json({
      success: true,
      envVars: {},
    })
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to fetch environment variables"
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
    const { key, value, action } = body

    if (!key || !action) {
      return NextResponse.json(
        { message: "Key and action are required" },
        { status: 400 }
      )
    }

    if (action === "set") {
      if (!value) {
        return NextResponse.json(
          { message: "Value is required for set action" },
          { status: 400 }
        )
      }
      // TODO: Save env var to database
      return NextResponse.json({
        success: true,
        envVars: { [key]: value },
      })
    } else if (action === "delete") {
      // TODO: Delete env var from database
      return NextResponse.json({
        success: true,
        envVars: {},
      })
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 })
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to update environment variables"
    return NextResponse.json({ message }, { status: 500 })
  }
}
