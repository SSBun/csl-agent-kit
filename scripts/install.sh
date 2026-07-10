#!/usr/bin/env bash
# Compatibility wrapper for the CSL Agent Kit npm CLI.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$REPO_ROOT/bin/csl-agent-kit.js" install "$@"
