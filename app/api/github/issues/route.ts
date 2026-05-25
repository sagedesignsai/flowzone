/**
 * GET/POST /api/github/issues
 *
 * List or create issues for a repository.
 *
 * GET:  List issues (query params: owner, repo, installationId, state)
 * POST: Create an issue (body: { owner, repo, installationId, title, body?, labels?, assignees? })
 */

import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { listIssues, createIssue } from "@/lib/github/issues"

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
    const state = (searchParams.get("state") ?? "open") as "open" | "closed" | "all"

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

    const issues = await listIssues({ owner, repo, installationId, state })

    return NextResponse.json({ issues })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list issues"
    console.error("GET /api/github/issues error:", message)
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
    const { owner, repo, installationId, title, body: issueBody, labels, assignees } = body

    if (!owner || !repo || !installationId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, installationId, title" },
        { status: 400 },
      )
    }

    const issue = await createIssue({
      owner,
      repo,
      installationId: Number(installationId),
      title,
      body: issueBody,
      labels,
      assignees,
    })

    return NextResponse.json(issue, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create issue"
    console.error("POST /api/github/issues error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
