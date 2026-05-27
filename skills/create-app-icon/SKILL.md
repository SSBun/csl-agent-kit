---
name: create-app-icon
description: Use when the user wants to design an app icon or generate a prompt for AI image generators. Analyzes the project's category, platform (iOS/macOS/web/CLI), audience, and brand to produce icon concepts plus a refined prompt with safe-zone and clipping guidance.
argument-hint: [project-path]
---

## Analyze Project

Scan the project to determine:
- **App category** (game, tool, health, finance, social, education, entertainment, etc.)
- **Platform** (iOS, macOS, web, CLI, cross-platform)
- **UI style** (minimalist, modern, playful, professional, etc.)
- **Target audience** (age range, professional vs casual, developers vs consumers)
- **Core features** and primary use case
- **Brand identity** (colors, mascots, symbols, existing assets)

Check for existing icons, screenshots, marketing materials, or brand guidelines in the project.

## Recommend Options

Based on analysis, propose 3-5 icon concepts. Each with:
1. **Style** — flat, 3D, abstract, illustrative, etc.
2. **Concept** — what's depicted
3. **Colors** — suggested palette
4. **Reasoning** — why it fits

Use `AskUserQuestion` to let user select or modify.

## Platform Specs

| Platform | Requirement | Value |
|---|---|---|
| All | Canvas size | 1024×1024 minimum, 2048×2048 recommended |
| iOS | Safe zone padding | 20-30px from edges at 1024px (superellipse mask) |
| macOS | Clipping margin | 40-60px on each side at 1024px (3D effects, shadows) |
| All | Avoid text | Illegible at small sizes |

## Generate Prompt

Use this structure:

```
[Subject]: [main visual element]
[Style]: [flat/3D/illustrated/abstract/minimalist]
[Colors]: [specific palette with hex codes]
[Composition]: [layout, element arrangement]
[Technical]: square, [size]×[size], clean edges
[Safety]: [iOS/macOS] safe zone with [X]px padding
[Background]: [solid/gradient/transparent]
[Additional]: [specific details]
```

**Example (productivity tool):**
```
A sleek minimalist icon featuring a stylized checklist with checkmarks,
flat design, primary color #007AFF (iOS blue), white background,
simple geometric shapes, perfect square 1024x1024, main content
centered with 30px padding from edges for iOS rounded corner mask
```

Show generated prompt to user. Ask if style, colors, or elements need adjusting. Iterate until confirmed.

## Rules

- Never create prompts without understanding the app first.
- Never skip platform-specific safe zone specs.
- Never include text in icon prompts (unreadable at small sizes).
- Always confirm style with user before finalizing.
