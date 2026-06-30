# WTR Lab Stalker

[![Validate](https://img.shields.io/github/actions/workflow/status/MasuRii/wtr-lab-stalker/validate.yml?style=for-the-badge&label=Validate)](https://github.com/MasuRii/wtr-lab-stalker/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://github.com/MasuRii/wtr-lab-stalker/blob/main/LICENSE)
[![Version](https://img.shields.io/github/package-json/v/MasuRii/wtr-lab-stalker?label=version&style=for-the-badge)](https://github.com/MasuRii/wtr-lab-stalker)
[![Greasy Fork](https://img.shields.io/badge/Install-Greasy%20Fork-green.svg?style=for-the-badge)](https://greasyfork.org/en/scripts/576097-wtr-lab-stalker)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![GitHub Issues](https://img.shields.io/github/issues/MasuRii/wtr-lab-stalker?style=for-the-badge)](https://github.com/MasuRii/wtr-lab-stalker/issues)
[![GitHub Stars](https://img.shields.io/github/stars/MasuRii/wtr-lab-stalker?style=for-the-badge)](https://github.com/MasuRii/wtr-lab-stalker/stargazers)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y01PSSVR)

A lightweight userscript that turns the WTR-LAB logo icon into a user-search toggle. When activated, the logo turns red and the existing navbar search field searches WTR Lab users instead of novels.

![WTR Lab Stalker logo activation preview](https://github.com/user-attachments/assets/a3ec1bee-dcee-4feb-aef9-99ab93ad7c74)

## Features

- **Logo-gated stalker mode** — click only the WTR-LAB icon to activate user search while keeping the WTR-LAB text link usable for home navigation.
- **Search hijack** — reuses the existing navbar search field and suppresses the native novel search while active.
- **Red visual state** — the logo and search icons turn crimson when stalker mode is enabled.
- **User lookup** — searches WTR Lab's user API and merges relevant leaderboard matches.
- **Load more** — fetches additional leaderboard pages on demand without increasing the result panel height.
- **Mobile aware** — opens and colors the mobile search control when activated on small viewports.

## Installation

1. Install a userscript manager. Recommended options:
   - [ScriptCat](https://docs.scriptcat.org/en/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Stay for Safari](https://apps.apple.com/app/id1591620171) (iOS Safari)
2. Install the script from [Greasy Fork](https://greasyfork.org/en/scripts/576097-wtr-lab-stalker) or [GitHub](https://github.com/MasuRii/wtr-lab-stalker/raw/main/dist/wtr-lab-stalker.user.js).
3. Visit `https://wtr-lab.com/` and click the WTR-LAB icon, not the text, to toggle stalker mode.

> **Note:** Tampermonkey may work, but this project follows the same ScriptCat, Violentmonkey, and Stay-first metadata standard as the related WTR Lab userscripts.

## Usage

1. Click the WTR-LAB logo icon in the navbar.
2. Type a username in the normal search field.
3. Press Enter or click a result to open that user's profile.
4. Click **Load more relevant users** to scan more leaderboard pages for the same query.
5. Click the logo icon again, or press Escape in the search field, to restore normal search behavior.

## Compatibility

- Target site: `https://wtr-lab.com/*`
- Recommended managers: ScriptCat, Violentmonkey, and Stay
- Output format: bundled JavaScript userscript generated from TypeScript source
- Browser support: modern browsers supported by the selected userscript manager

## Privacy

The script does not collect analytics or send personal data to this repository owner. It only calls WTR Lab endpoints from your browser session to search users and read leaderboard data.

> **Important:** This project is an independent userscript and is not affiliated with WTR Lab.

## Support

- [GitHub Issues](https://github.com/MasuRii/wtr-lab-stalker/issues)
- [Greasy Fork Feedback](https://greasyfork.org/en/scripts/576097-wtr-lab-stalker/feedback)

## License

MIT. See [LICENSE](https://github.com/MasuRii/wtr-lab-stalker/blob/main/LICENSE).
