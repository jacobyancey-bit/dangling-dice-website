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
|---|---|
| `tokens.css` | The only file allowed to contain hex colors. Surfaces, ink, borders, radii, type scale, per-site accents, data-viz palette. |
| `base.css` | Buttons, inputs, tags, cards, stat cards, tables, split hero, icons, focus rings, skeletons. Scoped under `.dds`. |
| `fonts.css` | Self-hosted Plus Jakarta Sans and JetBrains Mono (variable, OFL). No Google Fonts request. |
| `icons.js` | `icon(name, { label })` for Lucide stroke icons at 1.5px. Decorative unless `label` is given. |
| `design.css` | Imports fonts, tokens and base in order. |

To add an icon, put its Lucide name in `scripts/build-icons.js` and run `npm run build:icons`.

## Accents

Each accent passes 4.5:1 with white text and 3:1 against the dark canvas, so one value works
for CTAs and focus rings in both themes.

| Site | `--accent` | `--accent-hover` |
|---|---|---|
| web | `#0E7490` | `#155E75` |
| beats | `#BE185D` | `#9D174D` |
| dev | `#2563EB` | `#1D4ED8` |
| games | `#7C3AED` | `#6D28D9` |
| media | `#047857` | `#065F46` |

Accent is for primary CTAs, focus rings and the 3px left bar on hero or featured blocks only.
Never tint surfaces with it. `--viz-1` to `--viz-6` are allowed only inside charts, meters, DAW
lanes and game boards.

## Guardrail

`npm test` runs `scripts/lint-design.js`. It counts gradients, blur, box-shadow, radius over 8px,
hex colors outside `tokens.css`, and emoji, per app. Counts can only go down against
`scripts/design-baseline.json`. After a cleanup, run `npm run lint:design:update` to lock in the
lower numbers. It also re-checks every token contrast pair.

## Baseline (Phase 0, 2026-11-28, production)

Lighthouse 13.6 (performance / accessibility / best practices / SEO):

| Page | Mobile | Desktop |
|---|---|---|
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
