/**
 * GitHub Integration — Release & Tag Operations
 *
 * List, create releases and list tags.
 */

import { createInstallationOctokit } from "@/lib/github/auth"
import type { GitHubPROptions, CreateReleaseInput } from "@/lib/github/types"

// ── List Releases ──────────────────────────────────────────

/**
 * List releases for a repository.
 */
export async function listReleases(
  options: GitHubPROptions & { perPage?: number },
) {
  const { owner, repo, installationId, perPage = 30 } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.repos.listReleases({
    owner,
    repo,
    per_page: perPage,
  })

  return data.map((release) => ({
    id: release.id,
    tagName: release.tag_name,
    name: release.name,
    body: release.body,
    draft: release.draft,
    prerelease: release.prerelease,
    url: release.html_url,
    author: release.author?.login,
    createdAt: release.created_at,
    publishedAt: release.published_at,
  }))
}

// ── Create Release ─────────────────────────────────────────

/**
 * Create a release for a repository.
 */
export async function createRelease(
  options: GitHubPROptions & CreateReleaseInput,
) {
  const {
    owner,
    repo,
    installationId,
    tagName,
    targetCommitish,
    name,
    body,
    draft = false,
    prerelease = false,
  } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: tagName,
    target_commitish: targetCommitish,
    name: name ?? tagName,
    body: body ?? "",
    draft,
    prerelease,
  })

  return {
    id: data.id,
    tagName: data.tag_name,
    name: data.name,
    url: data.html_url,
    draft: data.draft,
    prerelease: data.prerelease,
    createdAt: data.created_at,
  }
}

// ── List Tags ──────────────────────────────────────────────

/**
 * List tags for a repository.
 */
export async function listTags(
  options: GitHubPROptions & { perPage?: number },
) {
  const { owner, repo, installationId, perPage = 30 } = options
  const octokit = createInstallationOctokit(installationId)

  const { data } = await octokit.rest.repos.listTags({
    owner,
    repo,
    per_page: perPage,
  })

  return data.map((tag) => ({
    name: tag.name,
    sha: tag.commit.sha,
    url: tag.zipball_url,
  }))
}
