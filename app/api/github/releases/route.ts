/**
 * GET/POST /api/github/releases
 *
 * List or create releases for a repository.
 *
 * GET:  List releases (query params: owner, repo, installationId)
 * POST: Create a release (body: { owner, repo, installationId, tagName, targetCommitish?, name?, body?, draft?, prerelease? })
 */

import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { listReleases, createRelease } from "@/lib/github/releases"

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
    if (isNaN(installationId)) {
      return NextResponse.json({ error: "Invalid installationId" }, { status: 400 })
    }

    const releases = await listReleases({ owner, repo, installationId })

    return NextResponse.json({ releases })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list releases"
    console.error("GET /api/github/releases error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      owner,
      repo,
      installationId,
      tagName,
      targetCommitish,
      name,
      body: releaseBody,
      draft,
      prerelease,
    } = body

    if (!owner || !repo || !installationId || !tagName) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: owner, repo, installationId, tagName",
        },
        { status: 400 },
      )
    }

    const release = await createRelease({
      owner,
      repo,
      installationId: Number(installationId),
      tagName,
      targetCommitish,
      name,
      body: releaseBody,
      draft,
      prerelease,
    })

    return NextResponse.json(release, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create release"
    console.error("POST /api/github/releases error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
