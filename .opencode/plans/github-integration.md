# GitHub Integration — Modularization & Gap Closure Plan

## Architecture

```
lib/github/                          # Modular GitHub service (replaces lib/github.ts)
  index.ts                           # Barrel: re-exports all + backward-compat `github` object
  auth.ts                            # JWT + installation auth factories
  repos.ts                           # listRepositories, getRepo, getFileContents
  branches.ts                        # listBranches (fix isDefault), createBranch, deleteBranch
  pulls.ts                           # createPullRequest, get/update/merge/list PRs
  issues.ts                          # listIssues, createIssue, addIssueComment
  commits.ts                         # listCommits, getCommit, compareCommits
  statuses.ts                        # createCommitStatus, listCommitStatuses
  workflows.ts                       # listWorkflows, dispatchWorkflow, listWorkflowRuns
  releases.ts                        # listReleases, createRelease, listTags
  installations.ts                   # listInstallations (fix reposCount), getRepoInstallation
  webhooks.ts                        # verifyWebhookSignature, handleEvent router
  types.ts                           # GitHub-specific types

lib/sandbox-git.ts                   # Keep + fix `force` bug in pushChanges
lib/tools/github.ts                  # NEW: Agent tools for GitHub operations
lib/tools/git.ts                     # Keep as-is (sandbox git tools)

app/api/github/                      # API routes
  repos/route.ts                     # Keep
  branches/route.ts                  # Keep + add DELETE handler
  pr/route.ts                        # Keep
  import/route.ts                    # Rewrite: create sandbox, store context in DB
  webhooks/route.ts                  # NEW: POST webhook receiver
  issues/route.ts                    # NEW: GET list, POST create
  pulls/route.ts                     # NEW: GET list PRs
  commits/route.ts                   # NEW: GET list commits
  workflows/route.ts                 # NEW: GET list, POST dispatch
  releases/route.ts                  # NEW: GET list, POST create
  sandbox/route.ts                   # NEW: GET sandbox status for chat
```

## File Conflict

`lib/github.ts` (file) → `lib/github/` (directory). Resolution:
1. Create `lib/github/` directory with `index.ts` + domain modules
2. `lib/github/index.ts` re-exports `github` object (same API)
3. Move old `lib/github.ts` → `lib/github/_legacy.ts`
4. All 6 existing `import { github } from "@/lib/github"` resolve to directory index

## Package Addition

- `@octokit/webhooks` — webhook signature verification + event routing

## Schema Changes (`prisma/schema.prisma`)

### SandboxRun (add)
```
repoPath    String?   // Path inside sandbox where repo is cloned
gitBranch   String?   // Branch checked out in sandbox
```

### GitRepo (add)
```
isFork      Boolean   @default(false)
description String?
language    String?
```

## Bug Fixes

| ID | Location | Current | Fix |
|----|----------|---------|-----|
| APP-001 | `branches.ts` | `isDefault: false` always | Accept defaultBranch param, compare against name |
| APP-002 | `installations.ts` | `reposCount: 0` | Query per-installation repo count |
| SANDBOX-001 | `sandbox-git.ts:pushChanges` | `force` ignored | Pass `force: force ?? false` |
| BRIDGE-001 | `chat/route.ts:tryCreateSandbox` | Always creates new sandbox | Check SandboxRun for existing |
| BRIDGE-002 | `import/route.ts` | Sandbox may not exist; best-effort | Create sandbox, store path in Run |

## Execution Phases

### Phase 0: Foundation (parallel)
- Install `@octokit/webhooks`
- Prisma migration (SandboxRun + GitRepo fields)
- Add `GITHUB_WEBHOOK_SECRET` to `.env.example`

### Phase 1: Modularize + Bug Fixes
- Create all 13 files in `lib/github/`
- Write `lib/github/index.ts` barrel with backward-compat `github` export
- Move old `lib/github.ts` to `_legacy.ts`
- Fix `force` bug in `sandbox-git.ts`

### Phase 2: Sandbox Context Bridge
- Rewrite import route to create sandbox + store context in DB
- Rewrite `tryCreateSandbox()` in chat route to reuse existing sandboxes

### Phase 3: Webhooks
- Create `lib/github/webhooks/` handler directory (push, PR, installation events)
- Create `app/api/github/webhooks/route.ts` with signature verification

### Phase 4: API Routes
- DELETE handler on branches route
- New routes: issues, pulls, commits, workflows, releases, sandbox

### Phase 5: Agent Tools
- Create `lib/tools/github.ts` with tools: createPR, createIssue, listIssues, dispatchWorkflow, createBranch, deleteBranch, listPullRequests
- Register in `flowzone-agent.ts`

### Phase 6: UI + Types
- Update `types/index.ts` with new domain types
- Fix settings UI: installation selector in github-section.tsx

### Phase 7: Validation
- `pnpm typecheck && pnpm lint` then `pnpm build`
