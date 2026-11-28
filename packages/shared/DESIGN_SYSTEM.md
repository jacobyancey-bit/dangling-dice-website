# Dangling Dice Studios design system

One structural foundation for all five subdomains (web, beats, dev, games, media). Each site
changes only its accent color. The rules come from the multi-subdomain design spec: neutral
surfaces, 6px/8px radii, no gradients, glows, glass or emoji, and an asymmetric split hero.

## Using it in an app

```css
/* in the app's main stylesheet */
@import '@dangling-dice/shared/design.css';
```

```html
<html lang="en" data-site="beats">   <!-- selects the accent -->
<body class="dds">                   <!-- opts the page into the primitives -->
```

```js
import { icon } from '@dangling-dice/shared/icons';
button.innerHTML = `${icon('download')} Download kit`;
```

| File | Purpose |
| --- | --- |
| `tokens.css` | The only file allowed to contain hex colors. Surfaces, ink, borders, radii, type scale, per-site accents, data-viz palette. |
| `base.css` | Buttons, inputs, tags, cards, stat cards, tables, split hero, icons, focus rings, skeletons. Scoped under `.dds`. |
| `fonts.css` | Self-hosted Plus Jakarta Sans and JetBrains Mono (variable, OFL). No Google Fonts request. |
| `icons.js` | `icon(name, { label })` for Lucide stroke icons at 1.5px. Decorative unless `label` is given. |
| `design.css` | Imports fonts, tokens and base in order. |

To add an icon, put its Lucide name in `scripts/build-icons.js` and run `npm run build:icons`.

## Ecosystem shell (top bar)

Every site shows the same 56px sticky bar: dice mark, "Dangling Dice Studios / site" (site name in
monospace), links to the other four sites, a "More" menu (catalog, VPN shield, Discord, YouTube),
and one accent-colored CTA. Below 900px the links collapse into a Menu button. Web also shows the
My Stash button. Staff mode adds a "Staff" button that opens the Ctrl+K palette; public visitors
never see it.

- Source: `packages/shared/shell.js` (`SHELL_SITES` holds each site's name, URL and CTA).
- The markup is written into each `index.html` at build time between `<!-- dds-shell:start -->`
  and `<!-- dds-shell:end -->`, so navigation works without JavaScript and causes no layout shift.
  After editing `shell.js`, run `npm run build:shell`. `npm test` fails if any page is out of date.
- `initStudioShell()` (exported from `@dangling-dice/shared`) adds menu behavior: open/close,
  Escape, outside click, and focus return.
- The bar is a `<div>`, not `<header>`, because legacy app CSS styles bare `header` elements with
  `!important`. It becomes the page `<header>` when each app retires its legacy header in Phase 3.
- `legacy-chrome.css` holds the rules old page headers still need (brand header, skeletons, stash
  drawer position). Drop its import when an app migrates; delete it when no app uses it.

Theme decision (Phase 2): dark only. Light tokens stay defined for later.

## Accents

Each accent passes 4.5:1 with white text and 3:1 against the dark canvas, so one value works
for CTAs and focus rings in both themes.

| Site | `--dds-accent` | `--dds-accent-hover` |
| --- | --- | --- |
| web | `#0E7490` | `#155E75` |
| beats | `#BE185D` | `#9D174D` |
| dev | `#2563EB` | `#1D4ED8` |
| games | `#7C3AED` | `#6D28D9` |
| media | `#047857` | `#065F46` |

Accent is for primary CTAs, focus rings and the 3px left bar on hero or featured blocks only.
Never tint surfaces with it. `--dds-viz-1` to `--dds-viz-6` are allowed only inside charts, meters, DAW
lanes and game boards.

## Guardrail

`npm test` runs `scripts/lint-design.js`. It counts gradients, blur, box-shadow, radius over 8px,
hex colors outside `tokens.css`, and emoji, per app. Counts can only go down against
`scripts/design-baseline.json`. After a cleanup, run `npm run lint:design:update` to lock in the
lower numbers. It also re-checks every token contrast pair.

## Baseline (Phase 0, 2026-11-28, production)

Lighthouse 13.6 (performance / accessibility / best practices / SEO):

| Page | Mobile | Desktop |
| --- | --- | --- |
| web | 81 / 89 / 100 / 92 | 98 / 89 / 100 / 92 |
| beats | trace failed (`NO_NAVSTART`, reproducible) / 79 / 100 / 92 | 97 / 79 / 100 / 92 |
| dev | 97 / 93 / 100 / 92 | 100 / 93 / 100 / 92 |
| games | 98 / 92 / 100 / 92 | 86 / 92 / 100 / 92 |
| media | 98 / 91 / 100 / 92 | 99 / 91 / 100 / 92 |
| admin | 95 / 100 / 100 / 58 (noindex, expected) | 95 / 100 / 100 / 58 |

Accessibility failures: color contrast (76 elements: beats, games, media, web), unlabeled
`<select>` (8, beats), unlabeled inputs (6, beats and dev), `aria-required-children` (6, games and
web), links distinguished by color only (4, beats and media), heading order (2, web).
SEO 92: `javascript:void(0)` privacy links (web) and a non-descriptive link text (dev).

Keyboard focus (first 30 Tab stops per page, desktop): all five public sites show a visible change
on every stop. Admin: focus repeatedly lands on an unlabeled `div` with no indicator, most likely
the Turnstile widget host; confirm in Phase 4.

Design-rule violations at baseline: see `scripts/design-baseline.json`
(web 958, beats 913, games 529, media 290, dev 218, shared legacy 508).

## Acceptance targets (Phase 5)

- Lighthouse accessibility at least 95 on every page, SEO 100 on public pages
- Zero focus-indicator failures
- Every app scope in `design-baseline.json` at zero (data-viz files excepted)

## Migration status (Phase 3)

| App | Status | Design violations | Lighthouse a11y / SEO |
| --- | --- | --- | --- |
| dev | Migrated 2026-11-28 | 0 (locked) | 100 / 100 (local build; baseline 93 / 92) |
| media | Migrated 2026-11-28 | 0 (locked) | 100 / 100 (local build; baseline 91 / 92) |
| games | Migrated 2026-11-28 | 0 (locked) | 100 / 100 (local build; baseline 92 / 92) |
| web (landing) | Migrated 2026-11-28 | 0 (locked) | 100 / 100 (local build; baseline 89 / 92) |
| admin | Phase 4 (own lint scope) | see baseline | 100 baseline |
| beats | Next | see baseline | 79 / 92 baseline |

How an app migrates (Dev is the reference):

1. Its stylesheet imports `design.css` + `shell.css` only (drop `fonts.css`/`tokens.css`/`legacy-chrome.css`
   imports and the Google Fonts `<link>`s), and `<body class="dds">`.
2. Remove the legacy brand `<header>`; set `landmark: true` for the app in `scripts/build-shell.js` so the
   shell renders as the page `<header>`. The page's single `<h1>` lives in the hero.
3. Hero: `.hero-split` with `.hero-copy` (max 58ch) and a live `.card.hero-tool` on the right.
4. No inline `style=""` colors; JavaScript toggles state classes (`is-ok`, `is-error`, `is-low`...) instead
   of writing colors. Decorative icons use `<span data-icon="name">` placeholders hydrated with `icon()`.
5. Escape all API/user data rendered with `innerHTML`; only `http(s)` URLs may become `href`s.
6. `npm run lint:design:update` to lock the app at zero.

Shared helpers added during migration: `initTabKeyboard(tablist)` (WAI-ARIA tabs), and in `base.css`
`.tabs`/`.tab`, `.toast-stack`/`.toast`, `.tip-card`, `.modal-overlay`/`.modal` and `.callout.is-warn`.

Hub markers: the landing page shows each subdomain only as a 2px top border and a status dot
(`--dds-site-*` constants). Every action uses the page's own `--dds-accent`. Tags are 4px monospace
(`--dds-radius-tag`); buttons and inputs are 6px.

Notes:

- `base.css` element rules use `:where(.dds)` so component classes (for example the shell CTA) always
  win. Do not raise their specificity.
- Vite configs never inline fonts (`assetsInlineLimit`), because CSP `font-src` allows `'self'` only.
- Status colors differ per theme so they pass 4.5:1 on every surface; the lint verifies them.
- Shared page patterns (skip link, eyebrow, buttons rows, section heads, callouts, Tutor Calculator promo,
  footer) live in `base.css`; `hydrateIcons()` is exported from `@dangling-dice/shared`. Put new generic
  patterns there instead of copying them into an app stylesheet.
- Utility pages put the tool directly after the headline on phones (see Media's hero reorder).
