#!/bin/sh
# Install repo git hooks (strip Cursor agent co-author from commits).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS="$ROOT/.githooks"
GIT_HOOKS="$ROOT/.git/hooks"
for hook in prepare-commit-msg commit-msg; do
  cp "$HOOKS/$hook" "$GIT_HOOKS/$hook"
  chmod +x "$GIT_HOOKS/$hook"
done
echo "Installed: prepare-commit-msg, commit-msg"
