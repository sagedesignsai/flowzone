/**
 * GitHub Integration — Barrel Module
 *
 * Re-exports all domain functions and provides the backward-compatible
 * `github` service object so existing `import { github } from "@/lib/github"` still works.
 *
 * New code should import from individual domain modules for tree-shaking clarity:
 *   import { createPullRequest } from "@/lib/github/pulls"
 *   import { listIssues } from "@/lib/github/issues"
 */

export {
  getInstallationOctokit,
  getInstallationToken,
} from "@/lib/github/auth"

export {
  listRepositories,
  getRepo,
  getFileContents,
  forkRepo,
  getRepoInstallation as getRepoInstallationFromRepos,
} from "@/lib/github/repos"

export {
  listBranches,
  createBranch,
  deleteBranch,
  listBranchesLegacy,
} from "@/lib/github/branches"

export {
  createPullRequest,
  getPullRequest,
  listPullRequests,
  updatePullRequest,
  mergePullRequest,
  listPullRequestReviews,
} from "@/lib/github/pulls"

export {
  listIssues,
  createIssue,
  getIssue,
  addIssueComment,
  updateIssue,
} from "@/lib/github/issues"

export {
  listCommits,
  getCommit,
  compareCommits,
} from "@/lib/github/commits"

export {
  createCommitStatus,
  listCommitStatuses,
  listCheckSuites,
} from "@/lib/github/statuses"

export {
  listWorkflows,
  dispatchWorkflow,
  listWorkflowRuns,
} from "@/lib/github/workflows"

export {
  listReleases,
  createRelease,
  listTags,
} from "@/lib/github/releases"

export {
  listInstallations,
  getRepoInstallation,
} from "@/lib/github/installations"

export {
  verifyAndReceive,
  onWebhookEvent,
  onWebhookError,
} from "@/lib/github/webhooks"

// ── Backward-compatible service object ─────────────────────

import { getInstallationOctokit, getInstallationToken } from "@/lib/github/auth"
import { listRepositories, getRepo, getFileContents, forkRepo } from "@/lib/github/repos"
import { listBranchesLegacy, createBranch, deleteBranch as deleteBranchFn } from "@/lib/github/branches"
import { createPullRequest } from "@/lib/github/pulls"
import { listInstallations, getRepoInstallation } from "@/lib/github/installations"

/**
 * Legacy service object for backward compatibility.
 *
 * @deprecated Import individual functions from domain modules instead.
 *   E.g., import { createPullRequest } from "@/lib/github/pulls"
 */
export const github = {
  getInstallationOctokit,
  getInstallationToken,
  listRepositories,
  getRepo,
  listBranches: listBranchesLegacy,
  deleteBranch: (owner: string, repo: string, branch: string, installationId: number) =>
    deleteBranchFn({ owner, repo, branch, installationId }),
  createBranch: (owner: string, repo: string, baseBranch: string, newBranch: string, installationId: number) =>
    createBranch({ owner, repo, baseBranch, newBranch, installationId }),
  createPullRequest: (owner: string, repo: string, head: string, base: string, title: string, body?: string, installationId?: number, draft?: boolean) =>
    createPullRequest({ owner, repo, installationId: installationId!, title, head, base, body, draft }),
  forkRepo,
  getFileContents,
  listInstallations,
  getRepoInstallation,
}
