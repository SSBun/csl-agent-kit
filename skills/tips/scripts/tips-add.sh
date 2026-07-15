#!/usr/bin/env bash
set -euo pipefail

data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
tips_dir="${CSL_AGENT_KIT_TIPS_DIR:-$data_dir/tips}"
tips_file="${CSL_AGENT_KIT_TIPS_FILE:-$tips_dir/tips.json}"
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
store_script="$script_dir/tips-store.js"
confirmed=0
keywords=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --confirmed)
      confirmed=1
      shift
      ;;
    --keywords)
      if [ "$#" -lt 2 ]; then
        printf '%s\n' 'Usage: tips-add.sh --confirmed --keywords "keyword-one,keyword-two" "one short tip"' >&2
        exit 2
      fi
      keywords="$2"
      shift 2
      ;;
    *)
      break
      ;;
  esac
done

tip="${*:-}"

if [ -z "$tip" ]; then
  printf '%s\n' 'Usage: tips-add.sh --confirmed --keywords "keyword-one,keyword-two" "one short tip"' >&2
  exit 2
fi

if [ "$confirmed" -ne 1 ]; then
  printf '%s\n' 'Refusing to write tip without --confirmed. Show the exact tip and keywords to the user and get explicit approval first.' >&2
  exit 2
fi

if [ -z "$keywords" ]; then
  printf '%s\n' 'Refusing to write tip without --keywords. Provide one to five comma-separated keywords confirmed by the user.' >&2
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
    if lockf -t 5 "$lock_file" env CSL_AGENT_KIT_TIPS_LOCKED=1 "$0" --confirmed --keywords "$keywords" "$tip"; then
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

node -e '
  try {
    const store = require(process.argv[1]);
    const keywords = process.argv[4].split(",").map((keyword) => keyword.trim());
    store.addTip(process.argv[2], process.argv[3], keywords);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
' -- "$store_script" "$tips_file" "$tip" "$keywords"

printf '%s\n' "$tips_file"
