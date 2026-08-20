---
name: figma-describe
description: Parses a Figma URL and generates a structured text description of the UI layer architecture. Use when the user provides a Figma URL and asks to parse, analyze, describe, or extract design information.
---

Parse a Figma design URL and output a framework-agnostic tree description of the UI layer architecture.

## Prerequisites

A Figma MCP server must be connected with a valid token. If no Figma MCP tools are available, tell the user to enable one and stop.

## Usage

`/figma-describe <figma-url>` or `/csl:figma-describe <figma-url>`.

## Workflow

1. Parse the URL. Extract the file key from `/design/` or `/file/`, and extract `node-id`. Normalize `1-2` to `1:2` if the MCP schema requires colons.
2. Inspect available Figma MCP tools when schema introspection exists. Prefer official Figma tools over alternate tools.
3. Fetch design data with `get_design_context(fileKey, nodeId)` when available. Use `get_metadata` only when context is truncated.
4. If only an alternate tool such as `get_figma_data` exists, use it and avoid deeper traversal unless the user asks.
5. Capture a screenshot when a screenshot tool exists. Tree output is still required when screenshots are unavailable.
6. Transform fetched data into the output format in `references/tree-output-format.md`.

## Tool Preference

- Official: `get_design_context`, `get_metadata`, `get_screenshot`.
- Alternate: `get_figma_data`; use image download tools only when image assets are needed.

If neither family exists, report which MCP servers or static tools are visible and ask the user to fix configuration.

## Rules

- Output design description only. No CSS, Swift, Flutter, or framework code.
- Extract only what Figma provides. Do not invent properties.
- Include meaningful sibling spatial relationships.
- Collapse repeated identical children.
- Summarize deep nesting.
- Skip default values such as `opacity:1` or `border:0`.
