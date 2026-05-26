#
# Flowzone Bash Extensions
#
# Provides custom PS1 with git status + Flowzone indicator,
# aliases for common operations, and auto-completion helpers.
#
# Source this in ~/.bashrc:  source ~/.flowzone-bashrc
#

# ── Custom Prompt ───────────────────────────────────────────
# Shows: [flowzone] main ✓  or  [flowzone] main +1
__flowzone_ps1() {
  local branch="" status="" fg="" flowzone_indicator=""

  # Git branch + status
  if git rev-parse --git-dir > /dev/null 2>&1; then
    branch=$(git branch --show-current 2>/dev/null)
    if [[ -z "$branch" ]]; then
      branch=$(git rev-parse --short HEAD 2>/dev/null)
      [[ -n "$branch" ]] && branch="detached@${branch}"
    fi

    local changes
    changes=$(git status --porcelain 2>/dev/null | wc -l)
    if [[ "$changes" -gt 0 ]]; then
      status=" +${changes}"
      fg="\[\033[38;2;239;68;68\]"  # red
    else
      status=" ✓"
      fg="\[\033[38;2;34;197;94\]"  # green
    fi
  fi

  # Flowzone connection indicator
  if [[ -n "${FLOWZONE_API_URL:-}" ]]; then
    flowzone_indicator="\[\033[38;2;99;102;241\]◆\[\033[0m\] "  # indigo diamond
  fi

  echo "${flowzone_indicator}\[\033[38;2;99;102;241\]flowzone\[\033[0m\] ${fg}${branch}${status}\[\033[0m\]"
}

# Only override PS1 if we're in an interactive shell
if [[ -t 0 ]] && [[ -n "$BASH" ]]; then
  PS1='$(__flowzone_ps1)\n\[\033[38;2;139;143;163\]\$\[\033[0m\] '
fi

# ── Aliases ─────────────────────────────────────────────────
alias fz-status='flowzone-bridge get-context 2>/dev/null || echo "Not connected to Flowzone"'
alias fz-push='flowzone-bridge push-changes'
alias fz-portal='x-www-browser http://localhost:9090'
alias fz-notify='flowzone-notify'

# Git shortcuts with Flowzone notifications
alias gs='git status'
alias gl='git log --oneline --graph --decorate -20'
alias gp='git push origin HEAD && flowzone-notify push "Pushed to origin/HEAD"'
alias gc='git commit'
alias gca='git add -A && git commit'

# ── Shell Completion Hints ──────────────────────────────────
complete -W "status push portal" fz
