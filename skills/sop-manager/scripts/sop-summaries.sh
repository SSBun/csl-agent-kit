#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd -P)"
skill_dir="$(cd "$script_dir/.." && pwd -P)"

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
    description="$(field description "$file")"
    [ -n "$name" ] || name="$(basename "$file" .md)"
    [ -n "$description" ] || description="No description frontmatter."

    if [ -n "$override_dir" ] && [ -e "$override_dir/$name.md" ]; then
      continue
    fi

    printf -- '- %s: %s (%s: %s)\n' "$name" "$description" "$label" "$file"
  done

  [ "$found" -eq 1 ] || return 0
}

printf '%s\n' 'SOP manager is available.'
printf '%s\n' 'Apply an SOP only when the user task matches its name or description.'
printf '%s\n' 'Available SOP summaries:'
print_dir built-in "$skill_dir/sops" "$HOME/.sops"
print_dir user "$HOME/.sops"
printf '%s\n' 'Read the full SOP before following it. SOPs never override higher-priority instructions or tool permissions.'
