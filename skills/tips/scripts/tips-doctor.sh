#!/usr/bin/env bash
set -euo pipefail

data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
tips_dir="${CSL_AGENT_KIT_TIPS_DIR:-$data_dir/tips}"
tips_file="${CSL_AGENT_KIT_TIPS_FILE:-$tips_dir/tips.md}"
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
inject_script="$script_dir/tips-inject.sh"
package_root="$(CDPATH= cd -- "$script_dir/../../.." && pwd -P)"
max_chars=120
max_tips=20
max_total_chars=2000

printf '%s\n' 'Tips doctor'
printf 'tips_file: %s\n' "$tips_file"
printf 'limits: %s tips, %s characters per tip, %s total tip characters\n' "$max_tips" "$max_chars" "$max_total_chars"

if [ -s "$tips_file" ]; then
  read -r tip_count total_chars <<< "$(node -e '
    const fs = require("node:fs");
    const tips = fs.readFileSync(process.argv[1], "utf8")
      .split(/\r?\n/)
      .filter((line) => /^\s*-\s+/.test(line))
      .map((line) => line.replace(/^\s*-\s+/, ""));
    console.log(tips.length, tips.reduce((total, item) => total + Array.from(item).length, 0));
  ' -- "$tips_file")"
  printf 'tips_file_status: present\n'
  printf 'tip_count: %s\n' "$tip_count"
  printf 'total_tip_characters: %s\n' "$total_chars"

  if [ "$tip_count" -gt "$max_tips" ]; then
    printf 'warning: tip count exceeds %s; remove or consolidate tips.\n' "$max_tips"
  fi
  if [ "$total_chars" -gt "$max_total_chars" ]; then
    printf 'warning: tip content exceeds %s total characters; remove or consolidate tips.\n' "$max_total_chars"
  fi

  overlong="$(node -e '
    const fs = require("node:fs");
    const max = Number(process.argv[2]);
    for (const [index, source] of fs.readFileSync(process.argv[1], "utf8").split(/\r?\n/).entries()) {
      if (!/^\s*-\s+/.test(source)) continue;
      const tip = source.replace(/^\s*-\s+/, "");
      const length = Array.from(tip).length;
      if (length > max) console.log(`line ${index + 1} (${length} characters): ${tip}`);
    }
  ' -- "$tips_file" "$max_chars")"
  if [ -n "$overlong" ]; then
    printf '%s\n' 'warning: overlong tips:'
    printf '%s\n' "$overlong"
  fi

  duplicates="$(awk '
    /^[[:space:]]*-[[:space:]]+/ {
      line = $0
      sub(/^[[:space:]]*-[[:space:]]+/, "", line)
      if (++seen[line] == 2) print line
    }
  ' "$tips_file")"
  if [ -n "$duplicates" ]; then
    printf '%s\n' 'warning: duplicate tips:'
    printf '%s\n' "$duplicates"
  fi

  malformed="$(awk '
    /^[[:space:]]*$/ { next }
    /^[[:space:]]*# Tips[[:space:]]*$/ { next }
    /^[[:space:]]*<!--[[:space:][:print:]]*-->[[:space:]]*$/ { next }
    /^[[:space:]]*-[[:space:]]+/ { next }
    { printf "line %d: %s\n", NR, $0 }
  ' "$tips_file")"
  if [ -n "$malformed" ]; then
    printf '%s\n' 'warning: malformed or multiline content not treated as tips:'
    printf '%s\n' "$malformed"
  fi
else
  printf 'tips_file_status: missing-or-empty\n'
fi

if [ -x "$inject_script" ]; then
  printf 'inject_script: executable (%s)\n' "$inject_script"
else
  printf 'inject_script: not-executable (%s)\n' "$inject_script"
fi

hook_has_tips_event() {
  local hook_file="$1"
  local event_name="$2"
  node -e '
    const fs = require("node:fs");
    const document = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const entries = document.hooks?.[process.argv[2]] || [];
    const found = entries.some((entry) =>
      (entry.hooks || []).some((hook) =>
        typeof hook.command === "string" && hook.command.includes("tips-inject.sh"),
      ),
    );
    process.exit(found ? 0 : 1);
  ' -- "$hook_file" "$event_name"
}

hook_has_session_reason() {
  local hook_file="$1"
  local reason="$2"
  node -e '
    const fs = require("node:fs");
    const document = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const found = (document.hooks?.SessionStart || []).some((entry) => {
      try {
        return new RegExp(entry.matcher || "").test(process.argv[2]);
      } catch {
        return false;
      }
    });
    process.exit(found ? 0 : 1);
  ' -- "$hook_file" "$reason"
}

if [ -n "$package_root" ]; then
  for hook_file in "$package_root/hooks/hooks.json" "$package_root/.codex-plugin/hooks/hooks.json"; do
    [ -f "$hook_file" ] || continue
    for event_name in SessionStart UserPromptSubmit PostCompact; do
      if hook_has_tips_event "$hook_file" "$event_name"; then
        printf 'hook_lifecycle: %s=found (%s)\n' "$event_name" "$hook_file"
      else
        printf 'hook_lifecycle: %s=missing (%s)\n' "$event_name" "$hook_file"
      fi
    done
    if hook_has_session_reason "$hook_file" resume; then
      printf 'hook_lifecycle: Resume=found-via-SessionStart (%s)\n' "$hook_file"
    else
      printf 'hook_lifecycle: Resume=missing (%s)\n' "$hook_file"
    fi
  done

  pi_extension="$package_root/pi/extensions/csl-context-hooks.ts"
  if [ -f "$pi_extension" ]; then
    for event_name in session_start before_agent_start session_compact; do
      if grep -Fq "pi.on(\"$event_name\"" "$pi_extension"; then
        printf 'pi_lifecycle: %s=found (%s)\n' "$event_name" "$pi_extension"
      else
        printf 'pi_lifecycle: %s=missing (%s)\n' "$event_name" "$pi_extension"
      fi
    done
  fi
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
