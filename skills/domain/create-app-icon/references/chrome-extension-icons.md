# Chrome Extension Icon Materials

Use this reference only after the transparent master passes validation and the user selects **Chrome Extension** materials.

## Standard Output Set

Generate the complete practical set as square RGBA PNG files without overwriting existing assets:

| Size | Purpose |
| --- | --- |
| 16×16 | Extension page favicon, context-menu use, and 1× toolbar action source |
| 24×24 | Optional toolbar action source for intermediate display scaling |
| 32×32 | Windows and 2× toolbar action source |
| 48×48 | `chrome://extensions` management page |
| 128×128 | Installation and Chrome Web Store package icon |

Declare 16, 32, 48, and 128 under the manifest `icons` key. For a toolbar action, provide 16, 24, and 32 under `action.default_icon`. Chrome renders the action icon in a 16-DIP square and chooses the closest supplied raster size for the current display scale.

Use PNG. Manifest icons do not support SVG or WebP, and unpacked extension action icons must use PNG.

## Artwork Sizing

Treat the approved 1024×1024 master as source artwork, not as a ready store icon.

For the required 128×128 Web Store package icon:

- keep the canvas exactly 128×128;
- for a square subject, fit the artwork to approximately 96×96 and center it, leaving 16 transparent pixels on each side;
- for other squarish subjects, target 75–80% of the canvas width while preserving aspect ratio;
- keep transparent corners and use alpha rather than baking the artwork into a platform mask.

Smaller toolbar assets may use more of their canvas to preserve legibility. Inspect 16×16 and 32×32 directly instead of relying only on a mechanical downscale. If legibility requires changing the approved shapes rather than scaling or padding them, show that optical variant and obtain approval before using it.

## Visual Requirements

- Make every icon square and front-facing.
- Verify the icon on both light and dark backgrounds.
- Do not add a border around the full 128×128 canvas; Chrome UI may add edges.
- Avoid large drop shadows and built-in perspective.
- For mostly dark artwork, a subtle light outer glow may improve dark-background contrast, but do not add it unless needed and approved.

## Manifest Integration

Edit an existing manifest only when the user requested setup or integration. Otherwise generate the files and provide this package-relative snippet:

```json
{
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "24": "icons/icon-24.png",
      "32": "icons/icon-32.png"
    }
  }
}
```

Preserve existing sibling fields under `action`, such as `default_popup` and `default_title`. Use the project's existing public-asset or package-root convention so every referenced file is included in the shipped ZIP.

## Validation

Before reporting completion:

1. Decode every file and verify PNG, RGBA, exact square dimensions, and a non-empty visible subject.
2. Verify the 128×128 artwork bounds and transparent padding against the sizing guidance above.
3. Inspect 16×16 and 32×32 at native size on light and dark backgrounds.
4. Parse the manifest and verify every `icons` and `action.default_icon` path exists in the packaged extension output.
5. Rebuild the extension when its workflow derives distribution files from public or source assets.

## Official Authority

Recheck current Chrome documentation when these requirements may have changed:

- [Manifest icons](https://developer.chrome.com/docs/extensions/reference/manifest/icons)
- [Configure extension icons](https://developer.chrome.com/docs/extensions/develop/ui/configure-icons)
- [chrome.action](https://developer.chrome.com/docs/extensions/reference/api/action)
- [Chrome Web Store images](https://developer.chrome.com/docs/webstore/images)
