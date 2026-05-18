#!/bin/bash
#
# Flowzone Pipeline Bridge Script
#
# Connects the desktop sandbox to the Flowzone API for status reporting,
# context fetching, and git operations. Designed to run inside an E2B
# desktop sandbox with environment variables injected at creation time.
#
# Usage:
#   ./flowzone-bridge.sh report-status [message]
#   ./flowzone-bridge.sh push-changes <commit-message>
#   ./flowzone-bridge.sh get-context
#

set -euo pipefail

# ── Environment Variables ──────────────────────────────────

FLOWZONE_API_URL="${FLOWZONE_API_URL:-}"
FLOWZONE_CHAT_ID="${FLOWZONE_CHAT_ID:-}"
FLOWZONE_PROJECT_ID="${FLOWZONE_PROJECT_ID:-}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# ── Helpers ────────────────────────────────────────────────

log_info() {
  echo "[flowzone-bridge] INFO: $*"
}

log_error() {
  echo "[flowzone-bridge] ERROR: $*" >&2
}

# Validate that all required environment variables are set.
validate_env() {
  local missing=()

  if [[ -z "$FLOWZONE_API_URL" ]]; then
    missing+=("FLOWZONE_API_URL")
  fi
  if [[ -z "$FLOWZONE_CHAT_ID" ]]; then
    missing+=("FLOWZONE_CHAT_ID")
  fi
  if [[ -z "$FLOWZONE_PROJECT_ID" ]]; then
    missing+=("FLOWZONE_PROJECT_ID")
  fi

  if [[ ${#missing[@]} -gt 0 ]]; then
    log_error "Missing required environment variables: ${missing[*]}"
    exit 1
  fi
}

# Perform an HTTP request with curl. Returns exit code and prints response.
# Usage: http_request <METHOD> <URL> [JSON_BODY]
http_request() {
  local method="$1"
  local url="$2"
  local body="${3:-}"

  local curl_args=(
    -sS
    --fail-with-body
    -X "$method"
    -H "Content-Type: application/json"
    -H "x-chat-id: ${FLOWZONE_CHAT_ID}"
    -H "x-project-id: ${FLOWZONE_PROJECT_ID}"
    --max-time 30
  )

  if [[ -n "$body" ]]; then
    curl_args+=(-d "$body")
  fi

  curl "${curl_args[@]}" "$url" 2>&1
}

# ── Commands ───────────────────────────────────────────────

# POST sandbox status to the Flowzone API.
# Optional message argument for status context.
cmd_report_status() {
  local message="${1:-}"
  local status_url="${FLOWZONE_API_URL}/api/desktop/status"

  log_info "Reporting status to ${status_url}"

  local hostname
  hostname="$(hostname 2>/dev/null || echo "unknown")"

  local timestamp
  timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  local payload
  payload=$(cat <<EOF
{
  "chatId": "${FLOWZONE_CHAT_ID}",
  "projectId": "${FLOWZONE_PROJECT_ID}",
  "status": "running",
  "hostname": "${hostname}",
  "timestamp": "${timestamp}",
  "message": "${message}"
}
EOF
)

  local response
  if response=$(http_request "POST" "$status_url" "$payload"); then
    log_info "Status reported successfully"
    echo "$response"
  else
    local exit_code=$?
    log_error "Failed to report status (exit code: ${exit_code})"
    log_error "Response: ${response:-<empty>}"
    exit 1
  fi
}

# Git add, commit, and push to the remote repository.
# Uses GITHUB_TOKEN for authentication if set.
cmd_push_changes() {
  local commit_message="${1:-}"

  if [[ -z "$commit_message" ]]; then
    log_error "push-changes requires a commit message"
    echo "Usage: $0 push-changes <commit-message>"
    exit 1
  fi

  log_info "Pushing changes with message: ${commit_message}"

  # Configure git credentials if GITHUB_TOKEN is available.
  if [[ -n "$GITHUB_TOKEN" ]]; then
    log_info "Configuring git credentials from GITHUB_TOKEN"
    git config --global credential.helper store

    local remote_url
    remote_url="$(git remote get-url origin 2>/dev/null || echo "")"

    if [[ -n "$remote_url" ]]; then
      # Inject token into remote URL for authentication.
      local auth_url
      auth_url="$(echo "$remote_url" | sed "s|https://|https://x-access-token:${GITHUB_TOKEN}@|")"
      git remote set-url origin "$auth_url"
    fi
  fi

  # Stage all changes.
  git add -A

  # Check if there are staged changes before committing.
  if git diff --cached --quiet; then
    log_info "No changes to commit"
    return 0
  fi

  # Commit and push.
  git commit -m "$commit_message"

  if git push origin HEAD; then
    log_info "Changes pushed successfully"
  else
    log_error "Failed to push changes"
    exit 1
  fi
}

# GET project context from the Flowzone API.
cmd_get_context() {
  local context_url="${FLOWZONE_API_URL}/api/desktop/context"

  log_info "Fetching context from ${context_url}"

  local response
  if response=$(http_request "GET" "$context_url"); then
    log_info "Context fetched successfully"
    echo "$response"
  else
    local exit_code=$?
    log_error "Failed to fetch context (exit code: ${exit_code})"
    log_error "Response: ${response:-<empty>}"
    exit 1
  fi
}

# ── Entry Point ────────────────────────────────────────────

main() {
  local command="${1:-}"

  if [[ -z "$command" ]]; then
    log_error "No command specified"
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  report-status [message]  Report sandbox status to Flowzone"
    echo "  push-changes <message>   Git commit and push changes"
    echo "  get-context              Fetch project context from Flowzone"
    exit 1
  fi

  # All commands require environment validation.
  validate_env

  case "$command" in
    report-status)
      cmd_report_status "${2:-}"
      ;;
    push-changes)
      cmd_push_changes "${2:-}"
      ;;
    get-context)
      cmd_get_context
      ;;
    *)
      log_error "Unknown command: ${command}"
      echo "Usage: $0 <command> [args]"
      echo ""
      echo "Commands:"
      echo "  report-status [message]  Report sandbox status to Flowzone"
      echo "  push-changes <message>   Git commit and push changes"
      echo "  get-context              Fetch project context from Flowzone"
      exit 1
      ;;
  esac
}

main "$@"
