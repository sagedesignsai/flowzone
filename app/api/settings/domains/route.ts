import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    // TODO: Fetch domains from database
    return NextResponse.json({
      success: true,
      domains: [],
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch domains"
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
    const { domain, action } = body

    if (!domain || !action) {
      return NextResponse.json(
        { message: "Domain and action are required" },
        { status: 400 }
      )
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { message: "Invalid domain format" },
        { status: 400 }
      )
    }

    if (action === "add") {
      // TODO: Add domain to database
      return NextResponse.json({
        success: true,
        domains: [domain],
      })
    } else if (action === "remove") {
      // TODO: Remove domain from database
      return NextResponse.json({
        success: true,
        domains: [],
      })
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update domains"
    return NextResponse.json({ message }, { status: 500 })
  }
}
