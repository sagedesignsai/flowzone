/**
 * GitHub Integration — Commit Operations
 *
 * List commits, get commit details, and compare commits.
 */

import { createInstallationOctokit } from "@/lib/github/auth"
import type { GitHubPROptions } from "@/lib/github/types"

// ── List Commits ───────────────────────────────────────────

/**
 * List commits for a repository.
 *
 * @param options.sha - Branch or commit SHA to start from
 * @param options.path - Only commits containing this file path
 * @param options.since - ISO 8601 date: only commits after this date
 * @param options.perPage - Results per page (default: 30)
 */
export async function listCommits(
  options: GitHubPROptions & {
    sha?: string
    path?: string
    since?: string
    perPage?: number
  },
) {
  const { owner, repo, installationId, sha, path, since, perPage = 30 } =
    options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    sha,
    path,
    since,
    per_page: perPage,
  })

  return data.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: commit.commit.author?.name ?? commit.author?.login ?? "unknown",
    date: commit.commit.author?.date ?? "",
    url: commit.html_url,
    authorAvatar: commit.author?.avatar_url,
  }))
}

// ── Get Commit ─────────────────────────────────────────────

/**
 * Get a single commit by SHA or ref.
 */
export async function getCommit(
  options: GitHubPROptions & { ref: string },
) {
  const { owner, repo, ref, installationId } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref,
  })

  return {
    sha: data.sha,
    message: data.commit.message,
    author: data.commit.author?.name ?? data.author?.login ?? "unknown",
    date: data.commit.author?.date ?? "",
    url: data.html_url,
    stats: data.stats,
    files: data.files?.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
    })),
  }
}

// ── Compare Commits ────────────────────────────────────────

/**
 * Compare two commits or refs.
 */
export async function compareCommits(
  options: GitHubPROptions & { base: string; head: string },
) {
  const { owner, repo, base, head, installationId } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.repos.compareCommits({
    owner,
    repo,
    base,
    head,
  })

  return {
    aheadBy: data.ahead_by,
    behindBy: data.behind_by,
    totalCommits: data.total_commits,
    commits: data.commits.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author?.name ?? c.author?.login ?? "unknown",
      date: c.commit.author?.date ?? "",
    })),
    files: data.files?.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
    })),
    status: data.status,
  }
}
