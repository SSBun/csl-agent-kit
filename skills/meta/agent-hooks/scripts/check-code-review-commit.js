#!/usr/bin/env node
"use strict";

// Keep the registered hook entry and its user settings stable; commit-guard owns policy.
const guard = require("../../../dev/commit-guard/scripts/check-commit.js");

if (require.main === module) guard.main();
module.exports = guard;
