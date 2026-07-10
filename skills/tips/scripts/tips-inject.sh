#!/usr/bin/env bash
set -euo pipefail

data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
tips_file="${CSL_AGENT_KIT_TIPS_FILE:-$data_dir/tips/tips.md}"

[ -s "$tips_file" ] || exit 0

tips_content="$(awk '
  /^[[:space:]]*$/ { next }
  /^[[:space:]]*# Tips[[:space:]]*$/ { next }
  /^[[:space:]]*<!--/ { next }
  { print }
' "$tips_file")"

[ -n "$tips_content" ] || exit 0

printf 'Persistent user tips loaded from %s.\n' "$tips_file"
printf '%s\n' 'Follow these tips when relevant unless they conflict with system, developer, or current user instructions.'
printf '%s\n' 'If a tip conflicts with a higher-priority instruction, follow the higher-priority instruction.'
printf '%s\n' 'Tips:'
printf '%s\n' "$tips_content"
