#!/usr/bin/env bash
set -euo pipefail

data_dir="${CSL_AGENT_KIT_HOME:-$HOME/.csl-agent-kit}"
tips_dir="${CSL_AGENT_KIT_TIPS_DIR:-$data_dir/tips}"
tips_file="${CSL_AGENT_KIT_TIPS_FILE:-$tips_dir/tips.json}"
script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
inject_script="$script_dir/tips-inject.sh"
store_script="$script_dir/tips-store.js"
package_root="$(CDPATH= cd -- "$script_dir/../../.." && pwd -P)"
max_chars=150
max_tips=20
max_total_chars=2000

printf '%s\n' 'Tips doctor'
printf 'tips_file: %s\n' "$tips_file"
printf 'limits: %s tips, %s characters per tip, %s total tip characters\n' "$max_tips" "$max_chars" "$max_total_chars"

node -e '
  const fs = require("node:fs");
  const store = require(process.argv[2]);
  const tipsFile = process.argv[1];
  if (!fs.existsSync(tipsFile) || fs.statSync(tipsFile).size === 0) {
    console.log("tips_file_status: missing-or-empty");
    process.exit(0);
  }

  console.log("tips_file_status: present");
  let document;
  try {
    document = JSON.parse(fs.readFileSync(tipsFile, "utf8"));
  } catch (error) {
    console.log(`warning: invalid tips JSON: ${error.message}`);
    process.exit(0);
  }

  const tips = Array.isArray(document.tips) ? document.tips : [];
  const usable = tips.filter((tip) => tip && typeof tip.text === "string");
  const totalChars = usable.reduce((total, tip) => total + Array.from(tip.text).length, 0);
  console.log(`tip_count: ${tips.length}`);
  console.log(`total_tip_characters: ${totalChars}`);
  if (tips.length > store.MAX_TIPS) console.log(`warning: tip count exceeds ${store.MAX_TIPS}; remove or consolidate tips.`);
  if (totalChars > store.MAX_TOTAL_TEXT_CHARS) console.log(`warning: tip content exceeds ${store.MAX_TOTAL_TEXT_CHARS} total characters; remove or consolidate tips.`);

  const overlong = usable
    .map((tip, index) => ({ tip, index, length: Array.from(tip.text).length }))
    .filter((item) => item.length > store.MAX_TEXT_CHARS);
  if (overlong.length) {
    console.log("warning: overlong tips:");
    for (const item of overlong) console.log(`tip ${item.index + 1} (${item.length} characters): ${item.tip.text}`);
  }

  const duplicates = new Set();
  const seen = new Set();
  for (const tip of usable) {
    if (seen.has(tip.text)) duplicates.add(tip.text);
    seen.add(tip.text);
  }
  if (duplicates.size) {
    console.log("warning: duplicate tips:");
    for (const tip of duplicates) console.log(tip);
  }

  try {
    store.validateDocument(document);
  } catch (error) {
    console.log(`warning: invalid tips data: ${error.message}`);
  }
' -- "$tips_file" "$store_script"

if [ -x "$inject_script" ]; then
  printf 'inject_script: executable (%s)\n' "$inject_script"
else
  printf 'inject_script: not-executable (%s)\n' "$inject_script"
fi

hook_has_command() {
  local hook_file="$1"
  local event_name="$2"
  local command_part="$3"
  node -e '
    const fs = require("node:fs");
    const document = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const entries = document.hooks?.[process.argv[2]] || [];
    const found = entries.some((entry) =>
      (entry.hooks || []).some((hook) =>
        typeof hook.command === "string" && hook.command.includes(process.argv[3]),
      ),
    );
    process.exit(found ? 0 : 1);
  ' -- "$hook_file" "$event_name" "$command_part"
}

if [ -n "$package_root" ]; then
  for hook_file in "$package_root/hooks/hooks.json" "$package_root/.codex-plugin/hooks/hooks.json"; do
    [ -f "$hook_file" ] || continue
    if hook_has_command "$hook_file" UserPromptSubmit tips-candidates.js; then
      printf 'hook_lifecycle: UserPromptSubmit=found (%s)\n' "$hook_file"
    else
      printf 'hook_lifecycle: UserPromptSubmit=missing (%s)\n' "$hook_file"
    fi
    for event_name in SessionStart PostCompact; do
      if hook_has_command "$hook_file" "$event_name" tips-inject.sh; then
        printf 'hook_lifecycle: %s=unexpected-full-injection (%s)\n' "$event_name" "$hook_file"
      else
        printf 'hook_lifecycle: %s=not-used (%s)\n' "$event_name" "$hook_file"
      fi
    done
  done

  pi_extension="$package_root/pi/extensions/csl-context-hooks.ts"
  if [ -f "$pi_extension" ]; then
    for event_name in before_agent_start; do
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
