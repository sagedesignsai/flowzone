#!/usr/bin/env python3
"""
Flowzone Panel Indicator for XFCE4 Genmon Plugin.

Reads env-info.json written by the status watchdog and outputs
Pango-markup text for the XFCE4 Generic Monitor panel plugin.

To add to panel:
  1. Right-click panel → Panel → Add New Items
  2. Add "Generic Monitor" (genmon)
  3. Right-click genmon → Properties
  4. Set Command: python3 /home/user/.flowzone-portal/indicator/flowzone-indicator.py
  5. Set Period: 10 seconds

Output color legend:
  ● green  = connected to Flowzone
  ● yellow = no Flowzone config, running locally
  ● red    = error state
"""

import json
import os
import subprocess
import sys

PORTAL_DIR = os.path.expanduser("/home/user/.flowzone-portal")
INFO_FILE = os.path.join(PORTAL_DIR, "env-info.json")


def get_git_branch() -> str:
    """Quick git branch check if info file is stale."""
    try:
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            capture_output=True,
            text=True,
            timeout=2,
            cwd=os.getcwd(),
        )
        return result.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return ""


def format_text() -> str:
    info = {"flowzoneUrl": "", "chatId": "", "branch": "", "gitChanges": ""}

    if os.path.exists(INFO_FILE):
        try:
            with open(INFO_FILE) as f:
                info = json.load(f)
        except (json.JSONDecodeError, OSError):
            pass

    flowzone_url = info.get("flowzoneUrl", "") or ""
    branch = info.get("branch", "") or get_git_branch()
    changes = info.get("gitChanges", "") or ""
    change_count = len([l for l in changes.split("\n") if l.strip()]) if changes else 0

    # Determine status indicator
    if flowzone_url:
        status_dot = '<span foreground="#22c55e">●</span>'
        status_text = "flowzone"
    else:
        status_dot = '<span foreground="#f59e0b">●</span>'
        status_text = "local"

    # Build output
    parts = [f"{status_dot} {status_text}"]

    if branch:
        parts.append(branch)

    if change_count > 0:
        parts.append(f'<span foreground="#ef4444">+{change_count}</span>')

    return "  ".join(parts)


def main():
    try:
        output = format_text()
        # Wrap in markup tag for Pango rendering
        print(f"<small>{output}</small>")
        sys.stdout.flush()
    except Exception as exc:
        print(f'<small><span foreground="#ef4444">●</span> error</small>')
        sys.stdout.flush()


if __name__ == "__main__":
    main()
