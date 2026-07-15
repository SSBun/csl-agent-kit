#!/usr/bin/env bash
set -euo pipefail

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
store_script="$script_dir/tips-store.js"

node -e '
  try {
    const store = require(process.argv[1]);
    const tipsFile = store.resolveTipsFile();
    const output = store.formatAllTips(store.loadTips(tipsFile), tipsFile);
    if (output) console.log(output);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
' -- "$store_script"
