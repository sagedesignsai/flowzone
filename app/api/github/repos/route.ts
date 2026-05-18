import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { github } from "@/lib/github"

/**
 * GET /api/github/repos
 *
 * List all repositories accessible to the user's GitHub App installations.
 * Protected — requires authenticated session.
 *
 * Query params:
 *   installationId (optional) — Filter to a specific installation.
 *                               If omitted, checks all installations the app has.
 *
 * Response:
 *   200 { repositories: GitRepoSummary[] }
 *   401 { error: "Unauthorized" }
 *   500 { error: string }
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
    const installationIdParam = searchParams.get("installationId")

    // If a specific installation is requested, list repos for that installation
    if (installationIdParam) {
      const installationId = Number(installationIdParam)
      if (isNaN(installationId)) {
        return NextResponse.json(
          { error: "Invalid installationId" },
          { status: 400 },
        )
      }

      const repositories = await github.listRepositories(installationId)
      return NextResponse.json({ repositories })
    }

    // Otherwise, list repos across ALL installations
    const installations = await github.listInstallations()

    const allRepos = await Promise.allSettled(
      installations.map((inst) => github.listRepositories(inst.id)),
    )

    const repositories = allRepos.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    )

    // Sort by updatedAt descending
    repositories.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )

    return NextResponse.json({ repositories, installations })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list repositories"
    console.error("GET /api/github/repos error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
