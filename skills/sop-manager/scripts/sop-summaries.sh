#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd -P)"
skill_dir="$(cd "$script_dir/.." && pwd -P)"
data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
user_sop_dir="${CSL_AGENT_KIT_SOPS_DIR:-$data_dir/sops}"

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

print_dir() {
  local label="$1"
  local dir="$2"
  local override_dir="${3:-}"
  local found=0

  [ -d "$dir" ] || return 0

  for file in "$dir"/*.md; do
    [ -e "$file" ] || continue
    found=1

    name="$(field name "$file")"
    description="$(field when_to_use "$file")"
    globs="$(list_field globs "$file")"
    [ -n "$name" ] || name="$(basename "$file" .md)"
    [ -n "$description" ] || description="Missing when_to_use frontmatter."
    [ -n "$globs" ] || globs="none"

    if [ -n "$override_dir" ] && [ -e "$override_dir/$name.md" ]; then
      continue
    fi

    printf -- '- %s: %s [globs: %s] (%s: %s)\n' "$name" "$description" "$globs" "$label" "$file"
  done

  [ "$found" -eq 1 ] || return 0
}

printf '%s\n' 'SOP manager is available.'
printf '%s\n' 'Apply an SOP only when the user task matches its when_to_use or name.'
printf '%s\n' 'Available SOP summaries:'
print_dir built-in "$skill_dir/sops" "$user_sop_dir"
print_dir user "$user_sop_dir"
printf '%s\n' 'Read the full SOP before following it. SOPs never override higher-priority instructions or tool permissions.'
