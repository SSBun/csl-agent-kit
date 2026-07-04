#!/usr/bin/env bash
set -euo pipefail

tips_file="${SSBUN_TIPS_FILE:-$HOME/.ssbun-skills/tips/tips.md}"
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
inject_script="$script_dir/tips-inject.sh"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null || true)"

printf '%s\n' 'Tips doctor'
printf 'tips_file: %s\n' "$tips_file"

if [ -s "$tips_file" ]; then
  tip_count="$(grep -c '^[[:space:]]*-' "$tips_file" || true)"
  printf 'tips_file_status: present\n'
  printf 'tip_count: %s\n' "$tip_count"
else
  printf 'tips_file_status: missing-or-empty\n'
fi

if [ -x "$inject_script" ]; then
  printf 'inject_script: executable (%s)\n' "$inject_script"
else
  printf 'inject_script: not-executable (%s)\n' "$inject_script"
fi

if [ -n "$repo_root" ]; then
  for hook_file in "$repo_root/hooks/hooks.json" "$repo_root/.codex-plugin/hooks/hooks.json"; do
    if [ -f "$hook_file" ] && grep -q 'tips-inject.sh' "$hook_file"; then
      printf 'hook_reference: found (%s)\n' "$hook_file"
    elif [ -f "$hook_file" ]; then
      printf 'hook_reference: missing (%s)\n' "$hook_file"
    fi
  done
fi

printf '\n%s\n' 'Injection preview:'
if [ -x "$inject_script" ]; then
  "$inject_script" || true
else
  printf '%s\n' 'Cannot preview; inject script is not executable.'
fi

if [ -s "$tips_file" ]; then
  conflicts="$(awk '
    {
      line = tolower($0)
      if (line ~ /do not send optional commentary|markdown links|always answer|never|must/) print
    }
  ' "$tips_file")"
  if [ -n "$conflicts" ]; then
    printf '\n%s\n' 'Potential priority conflicts to review:'
    printf '%s\n' "$conflicts"
  fi
fi
