/**
 * GitHub Integration — GitHub Actions Workflow Operations
 *
 * List workflows, dispatch workflow runs, and list workflow runs.
 */

import { createInstallationOctokit } from "@/lib/github/auth"
import type { GitHubPROptions, WorkflowDispatchInput } from "@/lib/github/types"

// ── List Workflows ─────────────────────────────────────────

/**
 * List all GitHub Actions workflows in a repository.
 */
export async function listWorkflows(options: GitHubPROptions) {
  const { owner, repo, installationId } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.actions.listRepoWorkflows({
    owner,
    repo,
  })

  return data.workflows.map((wf) => ({
    id: wf.id,
    name: wf.name,
    path: wf.path,
    state: wf.state,
    url: wf.html_url,
    badgeUrl: wf.badge_url,
    createdAt: wf.created_at,
    updatedAt: wf.updated_at,
  }))
}

// ── Dispatch Workflow ──────────────────────────────────────

/**
 * Trigger a workflow_dispatch event for a GitHub Actions workflow.
 */
export async function dispatchWorkflow(
  options: GitHubPROptions & WorkflowDispatchInput,
) {
  const { owner, repo, installationId, workflow_id, ref, inputs } = options
  const octokit = createInstallationOctokit(installationId)

  await octokit.rest.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id,
    ref,
    inputs: inputs ?? {},
  })

  return { dispatched: true, workflow_id, ref }
}

// ── List Workflow Runs ─────────────────────────────────────

/**
 * List runs for a specific workflow (or all workflows).
 *
 * @param options.workflowId - Optional: filter by workflow ID
 * @param options.status - Optional: filter by status (e.g. "completed", "in_progress")
 */
export async function listWorkflowRuns(
  options: GitHubPROptions & {
    workflowId?: string | number
    status?: string
    branch?: string
    perPage?: number
  },
) {
  const {
    owner,
    repo,
    installationId,
    workflowId,
    status,
    branch,
    perPage = 20,
  } = options
  const octokit = createInstallationOctokit(installationId)

  const params = {
    owner,
    repo,
    per_page: perPage,
    ...(status ? { status } : {}),
    ...(branch ? { branch } : {}),
  }

  let data: Awaited<ReturnType<typeof octokit.rest.actions.listWorkflowRuns>>
  if (workflowId) {
    const resp = await octokit.rest.actions.listWorkflowRuns({
      ...params,
      workflow_id: workflowId,
    })
    data = resp.data
  } else {
    const resp = await octokit.rest.actions.listWorkflowRunsForRepo(params)
    data = resp.data
  }

  return data.workflow_runs.map((run) => ({
    id: run.id,
    name: run.name,
    status: run.status,
    conclusion: run.conclusion,
    branch: run.head_branch,
    sha: run.head_sha,
    url: run.html_url,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    runNumber: run.run_number,
    triggeringActor: run.actor?.login,
  }))
}
