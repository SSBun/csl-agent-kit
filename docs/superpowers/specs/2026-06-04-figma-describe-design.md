# Figma Describe — Design Spec

**Status:** Historical design artifact. This document records the original design for the Figma Describe skill and is not the canonical implementation location.

**Current canonical skill location:** `skills/figma-describe/SKILL.md`

## Goal
Create a skill that takes a Figma URL, calls Figma MCP to extract design data, and outputs a structured text description of the UI layer architecture. Output is framework-agnostic — raw design facts only. Primary consumer: human reviews first, then feeds to agent for any-platform (web/iOS/Android) implementation.

## Workflow
1. Parse fileKey and nodeId from Figma URL
2. Call `get_design_context(fileKey, nodeId)`
3. If truncated → `get_metadata` first, then fetch children individually
4. Call `get_screenshot(fileKey, nodeId)` for visual reference
5. Transform design context data into tree outline
6. Output the outline

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
Include content and typography inline:
```
├── Text "Welcome back" (font:Inter 24 bold, color:#1A1A1A, lh:32)
```

### Depth
Top-level frames/sections only. Children summarized, not fully recursed.

## Example Output
```
Page: "Dashboard"
└── Frame "Dashboard Screen" (full-width, h:1024, bg:#F8F9FA)
    ├── Frame "Header" (top, full-width, h:64, bg:#FFFFFF, shadow:0 1 3 rgba(0,0,0,0.08))
    │   ├── "Logo" (left-aligned, w:120, h:32)
    │   ├── Frame "Nav Links" (horizontal row, center, gap:24)
    │   │   ├── Text "Home" (font:Inter 14 medium, color:#1A1A1A)
    │   │   ├── Text "Projects" (font:Inter 14 medium, color:#6B7280)
    │   │   └── Text "Settings" (font:Inter 14 medium, color:#6B7280)
    │   └── Frame "User Menu" (right-aligned)
    │       ├── "Avatar" (32x32, rounded:full)
    │       └── Text "John" (font:Inter 14 medium, color:#1A1A1A)
    ├── Frame "Content" (below Header, horizontal row, gap:0, fill-remaining)
    │   ├── Frame "Sidebar" (left, w:240, bg:#FFFFFF, border-right:1px #E5E7EB)
    │   │   ├── Text "Menu" (font:Inter 12 regular, color:#9CA3AF, padding:16 16 8)
    │   │   └── [4 children: Nav items, vertical stack, gap:4]
    │   └── Frame "Main" (fill-remaining, bg:#FFFFFF, padding:24)
    │       ├── Text "Overview" (font:Inter 24 bold, color:#1A1A1A, lh:32)
    │       ├── Frame "Stats Row" (horizontal row, gap:16, margin-top:16)
    │       │   ├── Frame "Stat Card" ×4 (flex-1, bg:#FFFFFF, rounded:12, padding:16, border:1px #E5E7EB)
    │       │   │   ├── Text "Revenue" (font:Inter 12 regular, color:#6B7280)
    │       │   │   ├── Text "$24,580" (font:Inter 24 bold, color:#1A1A1A, lh:32)
    │       │   │   └── Text "+12.5%" (font:Inter 12 medium, color:#10B981)
    │       ├── Frame "Chart Area" (margin-top:24, h:320, bg:#FFFFFF, rounded:12, border:1px #E5E7EB)
    │       └── Frame "Table" (margin-top:24)
    │           └── [Header row + 6 data rows, vertical stack, gap:0]
```

## Skill Location
Historical note: the original draft targeted a Claude-local skill path. The current canonical implementation lives at `skills/figma-describe/SKILL.md`.
