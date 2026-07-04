#!/usr/bin/env bash
set -euo pipefail

tips_file="${SSBUN_TIPS_FILE:-$HOME/.ssbun-skills/tips/tips.md}"

[ -s "$tips_file" ] || exit 0

printf '%s\n' 'User tips from ~/.ssbun-skills/tips/tips.md:'
sed '/^[[:space:]]*$/d' "$tips_file"
