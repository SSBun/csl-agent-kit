#!/usr/bin/env bash
# Install CSL skills for Cursor, Codex, or all platforms.
# Usage: ./scripts/install.sh [cursor|codex|all]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"

install_cursor() {
  mkdir -p ~/.cursor/plugins/local
  ln -sfn "$REPO_ROOT" ~/.cursor/plugins/local/CSL
  echo "✓ Cursor: ~/.cursor/plugins/local/CSL → $REPO_ROOT"
  echo "  Reload Cursor (Developer: Reload Window) if skills do not appear."
}

install_codex() {
  mkdir -p ~/.agents/skills
  for skill_dir in "$REPO_ROOT"/skills/*/; do
    name="$(basename "$skill_dir")"
    ln -sfn "$skill_dir" ~/.agents/skills/"$name"
    echo "✓ Codex: ~/.agents/skills/$name → $skill_dir"
  done
  echo "  Ensure [features] skills = true in ~/.codex/config.toml"
}

install_portable_link() {
  mkdir -p "$REPO_ROOT/.agents"
  if [ ! -e "$REPO_ROOT/.agents/skills" ]; then
    ln -sfn ../skills "$REPO_ROOT/.agents/skills"
    echo "✓ Repo: .agents/skills → skills/ (portable convention)"
  fi
}

case "$TARGET" in
  cursor)
    install_cursor
    ;;
  codex)
    install_codex
    install_portable_link
    ;;
  all)
    install_cursor
    install_codex
    install_portable_link
    echo ""
    echo "Claude Code: use /plugin marketplace add $REPO_ROOT && /plugin install CSL@SSBun-skills"
    ;;
  *)
    echo "Usage: $0 [cursor|codex|all]" >&2
    exit 1
    ;;
esac
