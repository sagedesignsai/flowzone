import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/github/setup
 *
 * This is the "Setup URL" for the GitHub App.
 * GitHub redirects here after a user installs the app.
 *
 * Query params:
 *   installation_id: The ID of the new installation
 *   setup_action: "install" | "update"
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const installationId = searchParams.get("installation_id")
  const setupAction = searchParams.get("setup_action")

  console.info(
    `[github:setup] ${setupAction} — installation: ${installationId}`
  )

  // Redirect the user back to the settings page where they can see their new installation
  // We could also redirect back to a specific project if we stored state in a cookie/session
  return NextResponse.redirect(new URL("/settings", request.url))
}
