#!/usr/bin/env bash
# Install CSL skills for Cursor, Codex, or all platforms.
# Usage: ./scripts/install.sh [cursor|codex|all]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  GREEN="$(printf '\033[32m')"
  YELLOW="$(printf '\033[33m')"
  RESET="$(printf '\033[0m')"
else
  GREEN=""
  YELLOW=""
  RESET=""
fi

die() {
  echo "✗ $*" >&2
  exit 1
}

print_status() {
  local status="$1"
  local label="$2"
  local color=""

  case "$status" in
    new) color="$GREEN" ;;
    updated) color="$YELLOW" ;;
  esac

  if [ "$status" = "unchanged" ]; then
    printf '%s\n' "$label"
  else
    printf '%s%s %s%s\n' "$color" "$status" "$label" "$RESET"
  fi
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
    if [ "$current" = "$source_real" ]; then
      print_status unchanged "$label"
      return
    fi

    case "$current" in
      /*) current_path="$current" ;;
      *) current_path="$(dirname "$target")/$current" ;;
    esac

    if current_real="$(canonical_path "$current_path" 2>/dev/null)" && [ "$current_real" = "$source_real" ]; then
      rm "$target"
      ln -s "$source_real" "$target"
      print_status updated "$label"
      return
    fi

    rm "$target"
    ln -s "$source_real" "$target"
    print_status updated "$label"
    return
  fi

  if [ -e "$target" ]; then
    die "$target already exists and is not a CSL-managed symlink. Remove or rename it before installing."
  fi

  ln -s "$source_real" "$target"
  print_status new "$label"
}

install_cursor() {
  ensure_symlink "$HOME/.cursor/plugins/local/CSL" "$REPO_ROOT" "Cursor: ~/.cursor/plugins/local/CSL"
  echo "  Reload Cursor (Developer: Reload Window) if skills do not appear."
}

remove_old_ssbun_skill_mirror() {
  local mirror_dir="$HOME/.ssbun-skills/skills"
  local path
  local removed=0

  [ -d "$mirror_dir" ] || return 0

  for path in "$mirror_dir"/*; do
    [ -e "$path" ] || [ -L "$path" ] || continue
    if [ -L "$path" ]; then
      rm "$path"
      removed=1
    fi
  done

  rmdir "$mirror_dir" 2>/dev/null || true
  if [ "$removed" -eq 1 ]; then
    printf '%s%s %s%s\n' "$YELLOW" "updated" "Removed obsolete ~/.ssbun-skills/skills symlink mirror" "$RESET"
  fi
}

install_codex() {
  if [ -L "$HOME/.agents/skills/sop-creator" ]; then
    rm "$HOME/.agents/skills/sop-creator"
    print_status updated "Codex: ~/.agents/skills/sop-creator"
  fi

  remove_old_ssbun_skill_mirror

  for skill_dir in "$REPO_ROOT"/skills/*/; do
    name="$(basename "$skill_dir")"
    ensure_symlink "$HOME/.agents/skills/$name" "$skill_dir" "Codex: ~/.agents/skills/$name"
  done
  echo "  Ensure [features] skills = true in ~/.codex/config.toml"
}

install_codex_plugin() {
  if ! command -v codex >/dev/null 2>&1; then
    echo "  Codex CLI not found; skipped Codex plugin install."
    echo "  Later run: codex plugin marketplace add $REPO_ROOT && codex plugin add csl@CSL"
    return
  fi

  codex plugin remove csl@CSL --json >/dev/null 2>&1 || true
  codex plugin marketplace add "$REPO_ROOT" --json >/dev/null
  codex plugin add csl@CSL --json >/dev/null
  print_status updated "Codex plugin: CSL"
  echo "  Restart Codex, then review/trust hooks with /hooks if prompted."
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
    install_codex_plugin
    ;;
  all)
    install_cursor
    install_codex
    install_portable_link
    install_codex_plugin
    echo ""
    echo "Claude Code: use /plugin marketplace add $REPO_ROOT && /plugin install CSL@SSBun-skills"
    ;;
  *)
    echo "Usage: $0 [cursor|codex|all]" >&2
    exit 1
    ;;
esac
