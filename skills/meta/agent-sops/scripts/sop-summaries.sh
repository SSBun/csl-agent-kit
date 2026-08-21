#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd -P)"
skill_dir="$(cd "$script_dir/.." && pwd -P)"
data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
user_sop_dir="${CSL_AGENT_KIT_SOPS_DIR:-$data_dir/sops}"
project_sop_dir="$PWD/.agents/sops"

field() {
  local key="$1"
  local file="$2"
  awk -v key="$key" '
    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { exit }
    in_frontmatter && index($0, key ":") == 1 {
      sub("^[^:]*:[[:space:]]*", "")
      gsub(/^"|"$/, "")
      print
      exit
    }
  ' "$file"
}

list_field() {
  local key="$1"
  local file="$2"
  awk -v key="$key" '
    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { exit }
    in_frontmatter && index($0, key ":") == 1 { in_list = 1; next }
    in_list && $0 ~ /^[[:space:]]*-[[:space:]]*/ {
      sub("^[[:space:]]*-[[:space:]]*", "")
      gsub(/^"|"$/, "")
      values = values (values ? ", " : "") $0
      next
    }
    in_list && $0 !~ /^[[:space:]]/ { exit }
    END { print values }
  ' "$file"
}

contains_sop() {
  local dir="$1"
  local target="$2"
  local file name

  [ -d "$dir" ] || return 1
  for file in "$dir"/*.md; do
    [ -e "$file" ] || continue
    name="$(field name "$file")"
    [ -n "$name" ] || name="$(basename "$file" .md)"
    [ "$name" = "$target" ] && return 0
  done
  return 1
}

is_overridden() {
  local name="$1"
  local dir
  shift

  for dir in "$@"; do
    contains_sop "$dir" "$name" && return 0
  done
  return 1
}

print_dir() {
  local label="$1"
  local dir="$2"
  local file name description globs
  shift 2

  [ -d "$dir" ] || return 0

  for file in "$dir"/*.md; do
    [ -e "$file" ] || continue

    name="$(field name "$file")"
    description="$(field when_to_use "$file")"
    globs="$(list_field globs "$file")"
    [ -n "$name" ] || name="$(basename "$file" .md)"
    [ -n "$description" ] || description="Missing when_to_use frontmatter."
    [ -n "$globs" ] || globs="none"

    is_overridden "$name" "$@" && continue
    printf -- '- %s: %s [globs: %s] (%s: %s)\n' "$name" "$description" "$globs" "$label" "$file"
  done
}

printf '%s\n' 'Agent SOPs is available.'
printf '%s\n' 'Apply an SOP only when the user task matches its when_to_use or name.'
printf '%s\n' 'Available SOP summaries:'
print_dir built-in "$skill_dir/sops" "$user_sop_dir" "$project_sop_dir"
print_dir user "$user_sop_dir" "$project_sop_dir"
print_dir project "$project_sop_dir"
printf '%s\n' 'Read the full SOP before following it. SOPs never override higher-priority instructions or tool permissions.'
