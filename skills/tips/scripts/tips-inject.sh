#!/usr/bin/env bash
set -euo pipefail

data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
tips_dir="${CSL_AGENT_KIT_TIPS_DIR:-$data_dir/tips}"
tips_file="${CSL_AGENT_KIT_TIPS_FILE:-$tips_dir/tips.md}"

[ -s "$tips_file" ] || exit 0

tips_content="$(awk '
  /^[[:space:]]*-[[:space:]]+/ {
    line = $0
    sub(/^[[:space:]]*-[[:space:]]+/, "- ", line)
    print line
  }
' "$tips_file")"

[ -n "$tips_content" ] || exit 0

printf '%s\n' 'CONFIRMED PERSISTENT USER INSTRUCTIONS'
printf 'Loaded from %s.\n' "$tips_file"
printf '%s\n' 'These instructions were explicitly confirmed by the user.'
printf '%s\n' 'They are mandatory whenever applicable, not optional suggestions.'
printf '%s\n' 'Before responding or using tools:'
printf '%s\n' '1. Check every instruction below.'
printf '%s\n' '2. Follow every applicable instruction.'
printf '%s\n' '3. Do not ignore an instruction because it is called a tip.'
printf '%s\n' '4. System, developer, and explicit current-turn user instructions take precedence.'
printf '%s\n' 'Instructions:'
printf '%s\n' "$tips_content"
