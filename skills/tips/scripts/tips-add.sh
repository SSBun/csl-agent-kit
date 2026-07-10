#!/usr/bin/env bash
set -euo pipefail

data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
tips_dir="${CSL_AGENT_KIT_TIPS_DIR:-$data_dir/tips}"
tips_file="${CSL_AGENT_KIT_TIPS_FILE:-$tips_dir/tips.md}"
max_chars=240
confirmed=0

if [ "${1:-}" = "--confirmed" ]; then
  confirmed=1
  shift
fi

tip="${*:-}"

if [ -z "$tip" ]; then
  printf '%s\n' 'Usage: tips-add.sh --confirmed "one short tip"' >&2
  exit 2
fi

if [ "$confirmed" -ne 1 ]; then
  printf '%s\n' 'Refusing to write tip without --confirmed. Show the exact tip to the user and get explicit approval first.' >&2
  exit 2
fi

if [ "${#tip}" -gt "$max_chars" ]; then
  printf 'Tip is too long (%s chars). Keep tips at %s chars or less; use sop-manager for longer guidance.\n' "${#tip}" "$max_chars" >&2
  exit 2
fi

mkdir -p "$tips_dir"

if [ ! -s "$tips_file" ]; then
  {
    printf '%s\n\n' '# Tips'
    printf '%s\n' '<!-- Short user preferences and commands. This file is injected into sessions by CSL Agent Kit hooks. -->'
    printf '\n'
  } >"$tips_file"
fi

printf -- '- %s\n' "$tip" >>"$tips_file"
printf '%s\n' "$tips_file"
