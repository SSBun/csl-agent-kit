# Figma Describe Tree Output Format

## Tree Conventions

- Top-level: `Page: "<name>"`
- Second-level: `Frame: "<name>"` with properties
- Child nodes: tree lines with inline properties
- Repeated children collapsed: `"Node" xN (properties)`
- Nesting beyond 2 levels summarized: `[N children: description]`

## Properties

Only include non-default, meaningful values.

| Category | Properties | Example |
| --- | --- | --- |
| Position | spatial relationship | `top, full-width`, `below Header`, `right-aligned` |
| Size | width/height in px or percent | `w:240`, `h:64`, `fill-width` |
| Layout | direction, gap, padding, alignment | `vertical stack, gap:12, padding:16, center` |
| Background | fill color or gradient | `bg:#FFFFFF`, `bg:linear-gradient(180, #FFF to #EEE)` |
| Border | width, color, radius | `border:1px #E0E0E0, rounded:8` |
| Shadow | type or params | `shadow:sm`, `shadow:0 2 8 rgba(0,0,0,0.1)` |
| Typography | font, size, weight, color, line-height | `font:Inter 14 medium, color:#333, lh:20` |
| Opacity | value | `opacity:0.6` |

## Examples

```text
Page: "Dashboard"
Frame: "Main" (w:1440, h:900, bg:#FFFFFF)
|-- Frame "Header" (top, full-width, h:64, horizontal, padding:24)
|   |-- Text "Welcome back" (font:Inter 24 bold, color:#1A1A1A, lh:32)
|-- Frame "Stat Card" x4 (flex-1, bg:#FFF, rounded:12, padding:16, border:1px #E5E7EB)
|-- Frame "Form" (vertical stack, gap:8)
|   |-- [5 children: 3 text inputs, 1 checkbox, 1 button]
```
