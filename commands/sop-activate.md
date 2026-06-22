---
description: Activate a built-in SOP as a Claude Code rule. Cursor users should use sop-manager instead.
allowed-tools: Bash, Read, Write, AskUserQuestion, Glob
---

Activate a built-in SOP so it loads as a native Claude Code rule. **Claude Code only** — Cursor users should use the `sop-manager` skill's Activate SOP workflow; this command does not write Cursor rules. Codex has no rules directory.

## Step 1: List Available SOPs

List all built-in SOPs:

```bash
ls "${CLAUDE_PLUGIN_ROOT}/skills/sop-manager/sops/" 2>/dev/null
```

Also check for custom SOPs already activated:

```bash
ls ~/.claude/rules/sop-*.md 2>/dev/null
ls .claude/rules/sop-*.md 2>/dev/null
```

Present the list to the user using `AskUserQuestion`.

## Step 2: Ask Which SOP to Activate

Use `AskUserQuestion`:

- **Question:** "Which SOP to activate?"
- **Header:** "Select SOP"
- **Options:** each built-in SOP file (drop `.md` extension as label)

If no SOPs exist, tell the user and stop.

## Step 3: Ask Scope and Activation Mode

Use `AskUserQuestion` with two questions:

**Question 1 — Scope:**
- **Header:** "Scope"
- **Options:**
  - "Global (`~/.claude/rules/`)" — applies to all projects
  - "Project (`.claude/rules/`)" — applies to this project only

**Question 2 — Activation mode:**
- **Header:** "Activation"
- **Options:**
  - "Conditional — load only when matching files are edited" (recommended)
  - "Always — load in every conversation"

## Step 4: Determine Globs (Conditional Only)

If conditional mode chosen, determine the glob pattern for the SOP.

**Option A — SOP already declares globs in frontmatter:** use those.

**Option B — Infer from SOP name/content:** ask the user to confirm or provide globs. Common mappings:

| SOP | Suggested glob |
|-----|----------------|
| swift-* | `["**/*.swift"]` |
| python-* | `["**/*.py"]` |
| golang-* / go-* | `["**/*.go"]` |
| typescript-* / ts-* | `["**/*.ts", "**/*.tsx"]` |
| kotlin-* | `["**/*.kt", "**/*.kts"]` |
| deploy-* | `["**/*.yml", "**/*.yaml", "**/Dockerfile"]` |

Use `AskUserQuestion` to confirm the glob or let the user type a custom one.

## Step 5: Write Activated Rule

Read the source SOP:

```bash
cat "${CLAUDE_PLUGIN_ROOT}/skills/sop-manager/sops/{selected}.md"
```

Then write to the destination with activation frontmatter prepended/replaced.

**Destination paths:**

| Scope | Path |
|-------|------|
| Global | `~/.claude/rules/sop-{name}.md` |
| Project | `.claude/rules/sop-{name}.md` |

**Frontmatter to write:**

For conditional mode:

```yaml
---
description: "{description from source SOP, or one-line summary}"
globs: {globs array}
alwaysApply: false
source: sop-manager:{original-name}
---
```

For always-on mode:

```yaml
---
description: "{description}"
alwaysApply: true
source: sop-manager:{original-name}
---
```

Preserve the original SOP body content below the frontmatter. If the source SOP already has frontmatter fields (name, version, owner, scope), keep them but ensure `description`, `globs`, `alwaysApply`, and `source` are set as above.

## Step 6: Create Directory if Missing

```bash
mkdir -p ~/.claude/rules/  # for global
mkdir -p .claude/rules/    # for project
```

## Step 7: Confirm

After writing, report:

```
✅ Activated: sop-{name}
   Scope: {global|project}
   Mode: {conditional|always}
   Globs: {globs or "all"}
   Path: {actual path written}

The rule takes effect immediately — no restart needed.
```

List the activated SOPs after:

```bash
ls ~/.claude/rules/sop-*.md .claude/rules/sop-*.md 2>/dev/null
```
