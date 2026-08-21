#!/usr/bin/env bash
# Compatibility wrapper for the CSL Agent Kit npm CLI.
(
  set -euo pipefail

  REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
  node "$REPO_ROOT/bin/csl-agent-kit.js" install "$@"
)
