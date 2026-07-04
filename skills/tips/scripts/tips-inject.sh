#!/usr/bin/env bash
set -euo pipefail

tips_file="${SSBUN_TIPS_FILE:-$HOME/.ssbun-skills/tips/tips.md}"

[ -s "$tips_file" ] || exit 0

tips_content="$(awk '
  /^[[:space:]]*$/ { next }
  /^[[:space:]]*# Tips[[:space:]]*$/ { next }
  /^[[:space:]]*<!--/ { next }
  { print }
' "$tips_file")"

[ -n "$tips_content" ] || exit 0

printf '%s\n' 'Persistent user tips loaded from ~/.ssbun-skills/tips/tips.md.'
printf '%s\n' 'Follow these tips when relevant unless they conflict with system, developer, or current user instructions.'
printf '%s\n' 'If a tip conflicts with a higher-priority instruction, follow the higher-priority instruction.'
printf '%s\n' 'Tips:'
printf '%s\n' "$tips_content"
