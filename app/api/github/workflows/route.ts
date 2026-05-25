/**
 * GET/POST /api/github/workflows
 *
 * List or dispatch GitHub Actions workflows.
 *
 * GET:  List workflows (query params: owner, repo, installationId)
 * POST: Dispatch a workflow (body: { owner, repo, installationId, workflow_id, ref, inputs? })
 */

import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { listWorkflows, dispatchWorkflow } from "@/lib/github/workflows"

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

    const workflows = await listWorkflows({ owner, repo, installationId })

    return NextResponse.json({ workflows })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list workflows"
    console.error("GET /api/github/workflows error:", message)
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
    const { owner, repo, installationId, workflow_id, ref, inputs } = body

    if (!owner || !repo || !installationId || !workflow_id || !ref) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: owner, repo, installationId, workflow_id, ref",
        },
        { status: 400 },
      )
    }

    const result = await dispatchWorkflow({
      owner,
      repo,
      installationId: Number(installationId),
      workflow_id,
      ref,
      inputs,
    })

    return NextResponse.json(result, { status: 202 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to dispatch workflow"
    console.error("POST /api/github/workflows error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
