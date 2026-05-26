---
name: beautiful-mermaid
description: Use when the user wants to render Mermaid diagrams as SVG, generate polished diagram visuals, create flowcharts, sequence diagrams, state diagrams, class diagrams, ER diagrams, or XY charts. Use for diagram visualization, theming, or presentation-quality diagram output.
---

## Setup

Installed globally via npm:

```bash
npm install -g beautiful-mermaid
```

Use via inline Node scripts. The library exposes two main functions:

- `renderMermaidSVG(mermaidCode)` — returns SVG string synchronously
- `renderMermaidASCII(mermaidCode)` — returns ASCII art string

## Usage

Create a temp Node script to render diagrams:

```js
const { renderMermaidSVG, renderMermaidASCII } = require('beautiful-mermaid')

const diagram = `graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[OK]
  B -->|No| D[End]`

const svg = renderMermaidSVG(diagram)
console.log(svg)
```

Run with `node <file>`.

## Theming

Pass theme options as second argument:

```js
renderMermaidSVG(code, { theme: 'tokyo-night' })
renderMermaidSVG(code, { bg: '#1e1e2e', fg: '#cdd6f4' })
```

Built-in themes: `tokyo-night`, `catppuccin`, `nord`, `dracula`, `github`, `solarized`, and more (15 total).

Minimal config: just `bg` and `fg` — rest derived via CSS `color-mix()`.

For terminals, use ASCII rendering:

```js
const ascii = renderMermaidASCII(code)
console.log(ascii)
```

## Output handling

SVG output can be saved to file:

```js
const fs = require('fs')
fs.writeFileSync('diagram.svg', svg)
```

Then display to user or reference the file path.

## Supported diagram types

| Type | Mermaid syntax |
|------|---------------|
| Flowchart | `graph TD`, `graph LR`, `graph RL` |
| State diagram | `stateDiagram-v2` |
| Sequence diagram | `sequenceDiagram` |
| Class diagram | `classDiagram` |
| ER diagram | `erDiagram` |
| XY Chart | `xychart` (bar, line, combined) |
