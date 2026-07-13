#!/usr/bin/env bash
set -euo pipefail

data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
tips_dir="${CSL_AGENT_KIT_TIPS_DIR:-$data_dir/tips}"
tips_file="${CSL_AGENT_KIT_TIPS_FILE:-$tips_dir/tips.md}"
max_chars=120
max_tips=20
max_total_chars=2000
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

if [[ "$tip" == *$'\n'* || "$tip" == *$'\r'* ]]; then
  printf '%s\n' 'Tip must be a single line.' >&2
  exit 2
fi

if [ -z "${tip//[[:space:]]/}" ]; then
  printf '%s\n' 'Tip cannot be blank.' >&2
  exit 2
fi

tip_chars="$(node -e 'process.stdout.write(String(Array.from(process.argv[1]).length))' -- "$tip")"
if [ "$tip_chars" -gt "$max_chars" ]; then
  printf 'Tip is too long (%s characters). Keep each tip at %s characters or fewer; use sop-manager for longer guidance.\n' "$tip_chars" "$max_chars" >&2
  exit 2
fi

tips_parent="$(dirname -- "$tips_file")"
lock_file="${tips_file}.lock"
mkdir -p "$tips_parent"

if [ "${CSL_AGENT_KIT_TIPS_LOCKED:-0}" != 1 ]; then
  if command -v flock >/dev/null 2>&1; then
    exec 9>"$lock_file"
    if ! flock -w 5 9; then
      printf 'Refusing to add a tip: timed out waiting for lock %s.\n' "$lock_file" >&2
      exit 2
    fi
  elif command -v lockf >/dev/null 2>&1; then
    if lockf -t 5 "$lock_file" env CSL_AGENT_KIT_TIPS_LOCKED=1 "$0" --confirmed "$tip"; then
      exit 0
    else
      status=$?
    fi
    if [ "$status" -eq 75 ]; then
      printf 'Refusing to add a tip: timed out waiting for lock %s.\n' "$lock_file" >&2
      exit 2
    fi
    exit "$status"
  else
    printf '%s\n' 'Refusing to add a tip: neither flock nor lockf is available.' >&2
    exit 2
  fi
fi

if [ -s "$tips_file" ]; then
  if awk '
    /^[[:space:]]*-[[:space:]]+/ {
      line = $0
      sub(/^[[:space:]]*-[[:space:]]+/, "", line)
      print line
    }
  ' "$tips_file" | grep -Fqx -- "$tip"; then
    printf '%s\n' 'This tip already exists.' >&2
    exit 2
  fi

  read -r tip_count total_chars <<< "$(node -e '
    const fs = require("node:fs");
    const tips = fs.readFileSync(process.argv[1], "utf8")
      .split(/\r?\n/)
      .filter((line) => /^\s*-\s+/.test(line))
      .map((line) => line.replace(/^\s*-\s+/, ""));
    console.log(tips.length, tips.reduce((total, item) => total + Array.from(item).length, 0));
  ' -- "$tips_file")"
else
  tip_count=0
  total_chars=0
fi

if [ "$tip_count" -ge "$max_tips" ]; then
  printf 'Refusing to add a tip: the file already contains the maximum of %s tips. Remove or consolidate an existing tip first.\n' "$max_tips" >&2
  exit 2
fi

resulting_total=$((total_chars + tip_chars))
if [ "$resulting_total" -gt "$max_total_chars" ]; then
  printf 'Refusing to add a tip: saved tip content would exceed 2,000 total characters (%s). Remove or consolidate existing tips first.\n' "$resulting_total" >&2
  exit 2
fi

if [ ! -s "$tips_file" ]; then
  {
    printf '%s\n\n' '# Tips'
    printf '%s\n' '<!-- Short user preferences and commands. This file is injected into sessions by CSL Agent Kit hooks. -->'
    printf '\n'
  } >"$tips_file"
fi

printf -- '- %s\n' "$tip" >>"$tips_file"
printf '%s\n' "$tips_file"
