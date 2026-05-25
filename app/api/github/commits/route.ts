/**
 * GET /api/github/commits
 *
 * List commits for a repository.
 *
 * Query params: owner, repo, installationId, sha (optional), path (optional), since (optional)
 */

import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { listCommits } from "@/lib/github/commits"

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
    const sha = searchParams.get("sha") ?? undefined
    const path = searchParams.get("path") ?? undefined
    const since = searchParams.get("since") ?? undefined
    const perPageParam = searchParams.get("perPage")

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing required params: owner, repo" },
        { status: 400 },
      )
    }

    if (!installationIdParam) {
      return NextResponse.json(
        { error: "Missing required param: installationId" },
        { status: 400 },
      )
    }

    const installationId = Number(installationIdParam)
    const perPage = perPageParam ? Number(perPageParam) : undefined

    if (isNaN(installationId)) {
      return NextResponse.json(
        { error: "Invalid installationId" },
        { status: 400 },
      )
    }

    const commits = await listCommits({
      owner,
      repo,
      installationId,
      sha,
      path,
      since,
      perPage,
    })

    return NextResponse.json({ commits })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list commits"
    console.error("GET /api/github/commits error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
