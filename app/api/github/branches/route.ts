import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { github } from "@/lib/github"
import type { GitCreateBranchRequest } from "@/types"

/**
 * GET /api/github/branches
 *
 * List branches for a repository.
 *
 * Query params:
 *   owner            — Repo owner (required)
 *   repo             — Repo name (required)
 *   installationId   — Installation ID for private repos (optional for public)
 *
 * Response:
 *   200 { branches: GitBranch[] }
 *   400 { error } — missing params
 *   401 { error } — unauthorized
 */
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

    const installationId = installationIdParam
      ? Number(installationIdParam)
      : undefined

    if (installationIdParam && isNaN(installationId!)) {
      return NextResponse.json(
        { error: "Invalid installationId" },
        { status: 400 },
      )
    }

    const branches = await github.listBranches(owner, repo, installationId)

    // Get the default branch name to mark it
    const repoInfo = await github.getRepo(owner, repo, installationId)
    const defaultBranch = repoInfo.defaultBranch

    const branchesWithDefault = branches.map((b) => ({
      ...b,
      isDefault: b.name === defaultBranch,
    }))

    return NextResponse.json({ branches: branchesWithDefault, defaultBranch })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list branches"
    console.error("GET /api/github/branches error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/github/branches
 *
 * Create a new branch in a repository.
 *
 * Request body: GitCreateBranchRequest
 *   { owner, repo, installationId, baseBranch, newBranch }
 *
 * Response:
 *   201 { branch: GitBranch }
 *   400 { error } — validation
 *   401 { error } — unauthorized
 *   500 { error } — creation failed
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = (await request.json()) as GitCreateBranchRequest

    if (
      !body.owner ||
      !body.repo ||
      !body.baseBranch ||
      !body.newBranch ||
      !body.installationId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: owner, repo, baseBranch, newBranch, installationId",
        },
        { status: 400 },
      )
    }

    const branch = await github.createBranch(
      body.owner,
      body.repo,
      body.baseBranch,
      body.newBranch,
      body.installationId,
    )

    return NextResponse.json({ branch }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create branch"
    console.error("POST /api/github/branches error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
