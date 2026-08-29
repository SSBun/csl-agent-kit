---
name: create-app-icon
description: Use when the user wants app-icon artwork, a transparent 1024×1024 PNG, Chrome extension icons, or platform icon materials. Offers 10 styles, generates a green-screen source, waits for approval, removes it with Node.js sharp, and validates outputs. Exclude general images, vector-system edits, and background-removal-only requests.
---

# Create App Icon

Use `/create-app-icon [project-path]`. If no path is provided, inspect the current working directory.

## Required Sequence

Follow these stages in order. Do not merge or skip the approval gate.

### 1. Determine the Style

Inspect only enough project context to identify its purpose, audience, platform, brand assets, subject, composition, safe zone, and intended platform background.

Read `references/icon-styles.md`. If no style is chosen, show its ten names plus Custom, display `assets/icon-style-catalog.png` when supported, and ask for one. Apply that preset without mixing styles unless requested. If the subject is unclear, offer at most three concepts in that style. Avoid text and green, yellow, or cyan subject colors that conflict with the key.

### 2. Generate the Green-Screen Source

Use the host's available image-generation capability. If none is available, provide the final prompt and stop; never claim that an image was generated.

Generate a square source with these fixed constraints:

```text
Create a polished app-icon subject on a perfectly flat solid #00FF00 chroma-key background.
The background must be one uniform color with no gradient, texture, lighting variation, floor, shadow, or reflection.
Keep the subject centered, fully separated from the canvas edges, and inside the target platform safe zone.
Do not use green, yellow, or cyan in the subject. No text, watermark, border, mockup, rounded-square mask, or background decoration.
Output a square 1024×1024 image.
```

Add the chosen visual details without weakening these constraints. Save non-destructively and show the source.

### 3. Wait for Source Approval

Ask the user to approve the displayed green-screen source or describe one visual change. Stop at this gate.

- On revision, regenerate and show the new source again.
- Run no background removal until the user explicitly approves the displayed version.
- Approval applies only to that exact source image.

### 4. Create the Transparent Master

Copy the approved source to a readable local path, then run the bundled helper from this skill directory:

```bash
node scripts/remove-green-background.mjs \
  --input <approved-source> \
  --output <transparent-master.png>
```

The helper rejects non-square inputs, non-uniform or non-green borders, existing output paths, and invalid alpha results. If it rejects the source, regenerate a cleaner green-screen image instead of weakening the checks.

Verify and report that the final file is:

- PNG;
- exactly 1024×1024;
- RGBA with transparent corners;
- non-empty, with the approved subject still visible.

Show the transparent result and report its saved path and final generation prompt.

### 5. Offer Platform Materials

Only after the transparent master passes validation, ask:

> Generate standard icon materials now? Choose any of Chrome Extension, macOS, iOS, and Android, and provide a destination if it is not the current project.

Do not generate platform materials without that selection. For selected platforms:

- preserve the project's Chrome manifest, asset catalog, Icon Composer, or Android `res/` convention;
- use current platform documentation for sizes, manifests, opacity, masks, and densities;
- for Chrome Extension, follow `references/chrome-extension-icons.md`; edit a manifest only when integration was requested, otherwise provide the files and manifest snippet;
- treat the master as source artwork, not automatically as a valid store icon;
- provide Icon Composer layer material, never a fake layered `.icon` from a flat PNG;
- avoid overwriting unless explicitly requested.

## Rules

- Determine style before generation and always use flat `#00FF00`.
- Never remove the background before source approval.
- Never deliver an unvalidated master or unselected platform materials.
