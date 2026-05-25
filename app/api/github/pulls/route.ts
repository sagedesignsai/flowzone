/**
 * GET /api/github/pulls
 *
 * List pull requests for a repository.
 *
 * Query params: owner, repo, installationId, state (optional, default: "open")
 */

import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { listPullRequests } from "@/lib/github/pulls"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const owner = searchParams.get("owner")
    const repo = searchParams.get("repo")
    const installationIdParam = searchParams.get("installationId")
    const state = (searchParams.get("state") ?? "open") as
      | "open"
      | "closed"
      | "all"

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing required params: owner, repo" },
        { status: 400 }
      )
    }

    if (!installationIdParam) {
      return NextResponse.json(
        { error: "Missing required param: installationId" },
        { status: 400 }
      )
    }

    const installationId = Number(installationIdParam)
    if (isNaN(installationId)) {
      return NextResponse.json(
        { error: "Invalid installationId" },
        { status: 400 }
      )
    }

    const pullRequests = await listPullRequests({
      owner,
      repo,
      installationId,
      state,
    })

    return NextResponse.json({ pullRequests })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list pull requests"
    console.error("GET /api/github/pulls error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
