#!/usr/bin/env bash
# Install CSL skills for Cursor, Codex, or all platforms.
# Usage: ./scripts/install.sh [cursor|codex|all]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"

die() {
  echo "✗ $*" >&2
  exit 1
}

canonical_path() {
  local path="$1"
  local dir
  local base

  if [ -d "$path" ]; then
    (cd "$path" && pwd -P)
    return
  fi

  dir="$(dirname "$path")"
  base="$(basename "$path")"
  (cd "$dir" && printf '%s/%s\n' "$(pwd -P)" "$base")
}

ensure_symlink() {
  local target="$1"
  local source="$2"
  local label="${3:-$target}"
  local source_path
  local source_real
  local current
  local current_path
  local current_real

  mkdir -p "$(dirname "$target")"
  case "$source" in
    /*) source_path="$source" ;;
    *) source_path="$(dirname "$target")/$source" ;;
  esac
  source_real="$(canonical_path "$source_path")" || die "Cannot resolve source: $source"

  if [ -L "$target" ]; then
    current="$(readlink "$target")" || die "Cannot read existing symlink: $target"
    case "$current" in
      /*) current_path="$current" ;;
      *) current_path="$(dirname "$target")/$current" ;;
    esac

    if current_real="$(canonical_path "$current_path" 2>/dev/null)" && [ "$current_real" = "$source_real" ]; then
      echo "✓ $label already linked → $source_real"
      return
    fi

    die "$target is a symlink to $current, not $source_real. Remove or rename it before installing."
  fi

  if [ -e "$target" ]; then
    die "$target already exists and is not a CSL-managed symlink. Remove or rename it before installing."
  fi

  ln -s "$source" "$target"
  echo "✓ $label → $source_real"
}

install_cursor() {
  ensure_symlink "$HOME/.cursor/plugins/local/CSL" "$REPO_ROOT" "Cursor: ~/.cursor/plugins/local/CSL"
  echo "  Reload Cursor (Developer: Reload Window) if skills do not appear."
}

install_codex() {
  if [ -L "$HOME/.agents/skills/sop-creator" ]; then
    rm "$HOME/.agents/skills/sop-creator"
    echo "✓ Codex: removed old ~/.agents/skills/sop-creator"
  fi

  for skill_dir in "$REPO_ROOT"/skills/*/; do
    name="$(basename "$skill_dir")"
    ensure_symlink "$HOME/.agents/skills/$name" "$skill_dir" "Codex: ~/.agents/skills/$name"
  done
  echo "  Ensure [features] skills = true in ~/.codex/config.toml"
}

install_portable_link() {
  ensure_symlink "$REPO_ROOT/.agents/skills" "../skills" "Repo: .agents/skills"
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
