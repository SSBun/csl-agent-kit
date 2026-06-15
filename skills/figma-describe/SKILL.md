---
name: figma-describe
description: Parses a Figma URL and generates a structured text description of the UI layer architecture. Use when the user provides a Figma URL and asks to parse, analyze, describe, or extract design information.
argument-hint: <figma-url>
---

Parse a Figma design URL and output a structured text description of the UI layer architecture.

## Prerequisites

A Figma MCP server must be connected with a valid token. If no Figma MCP is available, tell the user to enable one and stop.

## Usage

Invoke with a Figma URL: `/figma-describe <url>` (Claude Code: `/CSL:figma-describe <url>`).

## Workflow

Follow these steps in order.

### Step 1: Parse URL

Extract from the Figma URL:

- **File key:** segment after `/design/` or `/file/`
- **Node ID:** `node-id` query parameter; normalize `1-2` → `1:2` if the MCP schema requires colons

URL format: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

### Step 2: Discover MCP Tools

Inspect the connected Figma MCP tool schema before calling anything when runtime schema introspection is available. Use whichever set is available.

If runtime MCP schema introspection is unavailable, but Figma tools are statically exposed in the current session, proceed with those visible tool definitions instead of stopping. Prefer the official Figma tool family when both official and alternate tools are visible.

**Official Figma MCP** (preferred when present):

- `get_design_context(fileKey, nodeId)` — layout and style data
- `get_metadata(fileKey, nodeId)` — node map when context is truncated
- `get_screenshot(fileKey, nodeId)` — visual reference

If `get_design_context` response is truncated: fetch metadata, then fetch children individually.

**Framelink / alternate MCP** (e.g. `get_figma_data`):

- `get_figma_data(fileKey, nodeId)` — comprehensive node tree
- Re-fetch with `depth` only if the user explicitly requests deeper traversal
- Use `download_figma_images` only when image assets are needed

If neither tool family exists, report which MCP servers are connected or which static tools are visible, then ask the user to fix configuration.

### Step 3: Capture Visual Reference

When a screenshot tool exists (`get_screenshot` or equivalent), call it for the target node. Skip if unavailable — tree output is still required.

### Step 4: Generate Tree Outline

Transform fetched data into the tree format below. Output only — no framework-specific code.

## Output Format

### Tree Conventions

- Top-level: `Page: "<name>"`
- Second-level: `Frame: "<name>"` with properties
- Child nodes: `├──` / `└──` tree lines with inline properties
- Repeated children collapsed: `"Node" ×N (properties)`
- Nesting beyond 2 levels summarized: `[N children: description]`

### Property Categories

Only include non-default, meaningful values.

| Category | Properties | Example |
|---|---|---|
| Position | spatial relationship | `top, full-width`, `below Header`, `right-aligned` |
| Size | w, h (px or %) | `w:240`, `h:64`, `fill-width` |
| Layout | direction, gap, padding, alignment | `vertical stack, gap:12, padding:16, center` |
| Background | fill color, gradient | `bg:#FFFFFF`, `bg:linear-gradient(180, #FFF→#EEE)` |
| Border | width, color, radius | `border:1px #E0E0E0, rounded:8` |
| Shadow | type, params | `shadow:sm`, `shadow:0 2 8 rgba(0,0,0,0.1)` |
| Typography | font, size, weight, color, line-height | `font:Inter 14 medium, color:#333, lh:20` |
| Opacity | value | `opacity:0.6` |

### Text Nodes

```
├── Text "Welcome back" (font:Inter 24 bold, color:#1A1A1A, lh:32)
```

### Repeated Children

```
├── Frame "Stat Card" ×4 (flex-1, bg:#FFF, rounded:12, padding:16, border:1px #E5E7EB)
```

### Deep Nesting

```
│   └── Frame "Form" (vertical stack, gap:8)
│       └── [5 children: 3 Text inputs, 1 Checkbox, 1 Button]
```

## Rules

- Framework-agnostic output only. No CSS, Swift, or Flutter syntax.
- Extract only what Figma provides. Do not invent properties.
- Include spatial relationships between siblings.
- Collapse repeated identical children with `×N`.
- Summarize nesting beyond 2 levels.
- Skip default values (`opacity:1`, `border:0`).
