# Changelog

All notable changes to this project are documented here.

## [0.2.6] - 2026-07-01

### Fixed

- Updated all DOM selectors for the new Tailwind CSS / Base UI navbar redesign.
- Logo detection now identifies the inline-SVG brand icon by its `<path>` children instead of the removed `.navbar-brand` class.
- Search input container is now found by walking up to the nearest positioned ancestor, replacing the removed `.search-input` class.
- Mobile search button detection uses `:has(use[href="#search"])` on `<button>` elements instead of the removed `.d-lg-none` class.
- Injected CSS now targets stable `data-wtr-stalker-*` attributes set in JS, decoupling visual styling from site-specific class names.
- Dropdown menu restyled for the always-dark navbar (dark translucent background, light text, backdrop blur).
- Dark-mode CSS selectors updated to support Tailwind `.dark` alongside the legacy `[data-bs-theme="dark"]`.

## [0.2.5] - 2026-06-08

### Changed

- Refreshed release metadata and generated install artifacts for the 0.2.5 patch release.
- No runtime behavior changes were introduced.

## [0.2.4] - 2026-05-01

### Added

- Initialized the repository with the standard WTR Lab userscript GitHub project structure.
- Added Webpack bundling, userscript metadata injection, TypeScript checking, metadata validation, and GitHub Actions validation.
- Added README, license, contribution guide, security policy, code of conduct, issue templates, pull request template, and repository agent guidance.

### Existing userscript behavior

- Logo-activated stalker mode for WTR Lab user search.
- Navbar search hijacking while active, including native novel search suppression.
- User API search combined with relevant leaderboard matches.
- Load-more scanning for additional relevant leaderboard users.
- Mobile search button activation and red stalker-mode styling.
