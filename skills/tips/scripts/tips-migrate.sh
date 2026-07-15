#!/usr/bin/env bash
set -euo pipefail

data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
tips_dir="${CSL_AGENT_KIT_TIPS_DIR:-$data_dir/tips}"
source_file="${CSL_AGENT_KIT_TIPS_LEGACY_FILE:-$tips_dir/tips.md}"
destination_file="${CSL_AGENT_KIT_TIPS_FILE:-$tips_dir/tips.json}"
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
store_script="$script_dir/tips-store.js"
confirmed=0
keywords_json=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --confirmed)
      confirmed=1
      shift
      ;;
    --keywords-json|--source|--destination)
      if [ "$#" -lt 2 ]; then
        printf '%s\n' 'Usage: tips-migrate.sh --confirmed --keywords-json '\''{"Legacy tip":["keyword"]}'\''' >&2
        exit 2
      fi
      case "$1" in
        --keywords-json) keywords_json="$2" ;;
        --source) source_file="$2" ;;
        --destination) destination_file="$2" ;;
      esac
      shift 2
      ;;
    *)
      printf '%s\n' 'Usage: tips-migrate.sh --confirmed --keywords-json '\''{"Legacy tip":["keyword"]}'\''' >&2
      exit 2
      ;;
  esac
done

if [ "$confirmed" -ne 1 ]; then
  printf '%s\n' 'Refusing to migrate tips without --confirmed. Show the exact tips and keyword mapping to the user first.' >&2
  exit 2
fi

if [ -z "$keywords_json" ]; then
  printf '%s\n' 'Refusing to migrate tips without --keywords-json.' >&2
  exit 2
fi

tips_parent="$(dirname -- "$destination_file")"
lock_file="${destination_file}.lock"
mkdir -p "$tips_parent"

if [ "${CSL_AGENT_KIT_TIPS_LOCKED:-0}" != 1 ]; then
  if command -v flock >/dev/null 2>&1; then
    exec 9>"$lock_file"
    if ! flock -w 5 9; then
      printf 'Refusing to migrate tips: timed out waiting for lock %s.\n' "$lock_file" >&2
      exit 2
    fi
  elif command -v lockf >/dev/null 2>&1; then
    if lockf -t 5 "$lock_file" env CSL_AGENT_KIT_TIPS_LOCKED=1 "$0" --confirmed --keywords-json "$keywords_json" --source "$source_file" --destination "$destination_file"; then
      exit 0
    else
      status=$?
    fi
    if [ "$status" -eq 75 ]; then
      printf 'Refusing to migrate tips: timed out waiting for lock %s.\n' "$lock_file" >&2
      exit 2
    fi
    exit "$status"
  else
    printf '%s\n' 'Refusing to migrate tips: neither flock nor lockf is available.' >&2
    exit 2
  fi
fi

node -e '
  try {
    const store = require(process.argv[1]);
    const backup = store.migrateLegacyTips({
      sourceFile: process.argv[2],
      destinationFile: process.argv[3],
      keywordMap: JSON.parse(process.argv[4]),
    });
    console.log(`${process.argv[3]} (legacy backup: ${backup})`);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
' -- "$store_script" "$source_file" "$destination_file" "$keywords_json"
