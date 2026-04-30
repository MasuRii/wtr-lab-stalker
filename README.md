# 🔴 WTR Lab Stalker

<p align="center">
  <a href="https://github.com/MasuRii/wtr-lab-stalker/actions/workflows/validate.yml"><img alt="Validate" src="https://github.com/MasuRii/wtr-lab-stalker/actions/workflows/validate.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/github/license/MasuRii/wtr-lab-stalker"></a>
  <a href="package.json"><img alt="Version" src="https://img.shields.io/github/package-json/v/MasuRii/wtr-lab-stalker?label=version"></a>
  <a href="https://greasyfork.org/en/scripts/576097-wtr-lab-stalker"><img alt="Greasy Fork" src="https://img.shields.io/badge/Greasy%20Fork-install-success"></a>
  <a href="#installation"><img alt="Managers: ScriptCat, Violentmonkey, Stay" src="https://img.shields.io/badge/managers-ScriptCat%20%7C%20Violentmonkey%20%7C%20Stay-blue"></a>
  <a href="https://wtr-lab.com/"><img alt="Target: wtr-lab.com" src="https://img.shields.io/badge/target-wtr--lab.com-b11226"></a>
</p>

<p align="center">
  <img width="521" height="175" alt="WTR Lab Stalker logo activation preview" src="https://github.com/user-attachments/assets/a3ec1bee-dcee-4feb-aef9-99ab93ad7c74" />
</p>

WTR Lab Stalker is a lightweight userscript that turns the WTR-LAB logo icon into a user-search toggle. When activated, the logo turns red and the existing navbar search field searches WTR Lab users instead of novels.

[Install from Greasy Fork](https://greasyfork.org/en/scripts/576097-wtr-lab-stalker) · [Install from GitHub](https://github.com/MasuRii/wtr-lab-stalker/raw/main/WTR%20Lab%20Stalker.user.js)

## Features

- **Logo-gated stalker mode**: Click only the WTR-LAB icon to activate user search while keeping the WTR-LAB text link usable for home navigation.
- **Search hijack**: Reuses the existing navbar search field and suppresses the native novel search while active.
- **Red visual state**: The logo and search icons turn crimson when stalker mode is enabled.
- **User lookup**: Searches WTR Lab's user API and merges relevant leaderboard matches.
- **Load more**: Fetches additional leaderboard pages on demand without increasing the result panel height.
- **Mobile aware**: Opens and colors the mobile search control when activated on small viewports.

## Installation

1. Install a userscript manager. Recommended options:
   - [ScriptCat](https://docs.scriptcat.org/en/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Stay for Safari](https://apps.apple.com/app/id1591620171) on iOS Safari
2. Open the [Greasy Fork script page](https://greasyfork.org/en/scripts/576097-wtr-lab-stalker).
3. Install the script through your userscript manager.
4. Visit `https://wtr-lab.com/` and click the WTR-LAB icon, not the text, to toggle stalker mode.

> [!NOTE]
> Tampermonkey may work, but this project follows the same ScriptCat, Violentmonkey, and Stay-first metadata standard as the related WTR Lab userscripts.

## How to use

1. Click the WTR-LAB logo icon in the navbar.
2. Type a username in the normal search field.
3. Press Enter or click a result to open that user's profile.
4. Click **Load more relevant users** to scan more leaderboard pages for the same query.
5. Click the logo icon again, or press Escape in the search field, to restore normal search behavior.

## Compatibility

- Current userscript version: `0.2.4`
- Target site: `https://wtr-lab.com/*`
- Recommended managers: ScriptCat, Violentmonkey, and Stay
- Output format: bundled JavaScript userscript generated from TypeScript source
- Browser support: modern browsers supported by the selected userscript manager

## Development

The source lives under `src/`. Webpack bundles it into the distributable userscript file:

```bash
npm install
npm run build
npm run validate
```

Important files:

- `src/index.ts` - userscript runtime
- `userscript.metadata.cjs` - userscript metadata header
- `webpack.config.cjs` - bundles TypeScript into `WTR Lab Stalker.user.js`
- `scripts/validate-userscript.cjs` - validates generated metadata

## Privacy

The script does not collect analytics or send personal data to this repository owner. It only calls WTR Lab endpoints from your browser session to search users and read leaderboard data.

> [!IMPORTANT]
> This project is an independent userscript and is not affiliated with WTR Lab.
