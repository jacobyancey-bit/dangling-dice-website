/**
 * Dangling Dice Studios — shared ecosystem navigation shell (56px sticky top bar).
 *
 * The markup is rendered at BUILD time into each app's index.html by scripts/build-shell.js
 * (between <!-- dds-shell:start --> and <!-- dds-shell:end -->), so navigation works without
 * JavaScript, is crawlable, and causes no layout shift. `npm test` fails if any page drifts.
 * initStudioShell() only adds behavior: the mobile menu, the "More" menu and keyboard handling.
 */
import { icon } from './icons.js';

const ROOT = 'https://dangling-dice-studios.com';

export const SHELL_SITES = {
  web: { name: 'Studio', url: `${ROOT}/`, cta: { label: 'Browse catalog', href: '/#catalog' } },
  beats: { name: 'Beats', url: 'https://beats.dangling-dice-studios.com/', cta: { label: 'Open sequencer', href: '#projectSequencerWorkspace' } },
  games: { name: 'Games', url: 'https://games.dangling-dice-studios.com/', cta: { label: 'Browse games', href: '#gamesCatalogSection' } },
  media: { name: 'Media', url: 'https://media.dangling-dice-studios.com/', cta: { label: 'Convert a track', href: '#converter' } },
  dev: { name: 'Dev', url: 'https://dev.dangling-dice-studios.com/', cta: { label: 'Open sandboxes', href: '#sandboxes' } },
};

// Destinations previously in the rail's "Discovery" group, kept reachable from every page
export const SHELL_MORE_LINKS = [
  { label: 'Full catalog', href: `${ROOT}/#catalog`, icon: 'book-open' },
  { label: 'VPN shield', href: `${ROOT}/#vpnShield`, icon: 'shield-check' },
  { label: 'Discord', href: 'https://discord.gg/uFYMQahNZz', icon: 'external-link', external: true },
  { label: 'YouTube', href: 'https://www.youtube.com/@danglingdicestudios', icon: 'external-link', external: true },
];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * @param {keyof SHELL_SITES} site
 * @param {{ stash?: boolean, landmark?: boolean }} options
 *   stash: render the My Stash button (web only)
 *   landmark: render as the page <header> (apps migrated in Phase 3 that no longer ship legacy header CSS)
 * @returns {string} shell HTML
 */
export function renderShell(site, { stash = false, landmark = false } = {}) {
  const current = SHELL_SITES[site];
  if (!current) throw new Error(`Unknown shell site "${site}"`);
  const brandHref = site === 'web' ? '/' : `${ROOT}/`;
  // On the root site, same-site links stay relative so they work on localhost and previews
  const hubHref = (key) => (key === site ? '/' : SHELL_SITES[key].url);
  const ext = (l) => (l.external ? ' target="_blank" rel="noopener noreferrer"' : '');

  const hubLinks = Object.entries(SHELL_SITES)
    .map(([key, s]) => `<a class="dds-shell-link" href="${esc(hubHref(key))}"${key === site ? ' aria-current="page"' : ''}>${esc(s.name)}</a>`)
    .join('');

  const moreItems = SHELL_MORE_LINKS.map(
    (l) => `<a class="dds-shell-menu-item" href="${esc(l.href)}"${ext(l)}>${icon(l.icon)}<span>${esc(l.label)}</span>${l.external ? '<span class="dds-sr-only"> (opens in a new tab)</span>' : ''}</a>`
  ).join('');

  const mobileHubs = Object.entries(SHELL_SITES)
    .map(([key, s]) => `<a class="dds-shell-menu-item" href="${esc(hubHref(key))}"${key === site ? ' aria-current="page"' : ''}><span>${esc(s.name)}</span></a>`)
    .join('');

  const stashBtn = stash
    ? `<button type="button" class="dds-shell-icon-btn" onclick="toggleMyStash()" aria-label="My Studio Stash">${icon('archive')}<span id="stashCountBadge" class="dds-shell-count">0</span></button>`
    : '';

  // Legacy app CSS styles bare `header` elements with !important rules, so unmigrated apps get a
  // <div>; migrated apps (landmark: true) get the real page <header> landmark.
  const tag = landmark ? 'header' : 'div';
  return `<${tag} class="dds-shell" data-dds-shell="${esc(site)}">
  <div class="dds-shell-inner">
    <a class="dds-shell-brand" href="${brandHref}">
      ${icon('dice-5', { className: 'dds-shell-mark' })}
      <span class="dds-shell-name">Dangling Dice Studios</span>${site === 'web' ? '' : `<span class="dds-shell-sep" aria-hidden="true">/</span><span class="dds-shell-site">${esc(site)}</span>`}
    </a>
    <nav class="dds-shell-nav" aria-label="Studio subdomains">
      ${hubLinks}
      <div class="dds-shell-more">
        <button type="button" class="dds-shell-link dds-shell-more-btn" aria-expanded="false" aria-controls="ddsShellMoreMenu">More${icon('chevron-down')}</button>
        <div class="dds-shell-menu" id="ddsShellMoreMenu" hidden>${moreItems}</div>
      </div>
    </nav>
    <div class="dds-shell-actions">
      <span id="ddsShellStaffSlot" class="dds-shell-staff-slot"></span>
      ${stashBtn}
      <a class="dds-shell-cta" href="${esc(current.cta.href)}">${esc(current.cta.label)}</a>
      <button type="button" class="dds-shell-icon-btn dds-shell-menu-btn" aria-expanded="false" aria-controls="ddsShellMobileMenu" aria-label="Open menu">${icon('menu')}</button>
    </div>
  </div>
  <div class="dds-shell-mobile" id="ddsShellMobileMenu" hidden>
    <nav aria-label="Studio subdomains (mobile)">${mobileHubs}</nav>
    <div class="dds-shell-mobile-divider"></div>
    ${moreItems}
  </div>
</${tag}>`;
}

/** Wires up the build-time shell: More menu, mobile menu, Escape / outside-click to close. */
export function initStudioShell() {
  if (typeof document === 'undefined') return;
  const shell = document.querySelector('.dds-shell');
  if (!shell || shell.dataset.ddsShellReady) return;
  shell.dataset.ddsShellReady = 'true';

  const pairs = [
    [shell.querySelector('.dds-shell-more-btn'), shell.querySelector('#ddsShellMoreMenu')],
    [shell.querySelector('.dds-shell-menu-btn'), shell.querySelector('#ddsShellMobileMenu')],
  ].filter(([btn, panel]) => btn && panel);

  const setOpen = (btn, panel, open) => {
    btn.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (btn.classList.contains('dds-shell-menu-btn')) btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  const closeAll = (except) => pairs.forEach(([b, p]) => b !== except && setOpen(b, p, false));

  for (const [btn, panel] of pairs) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = btn.getAttribute('aria-expanded') !== 'true';
      closeAll(btn);
      setOpen(btn, panel, open);
      if (open) panel.querySelector('a, button')?.focus();
    });
    panel.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(btn, panel, false);
    });
  }

  document.addEventListener('click', (e) => {
    if (!shell.contains(e.target)) closeAll();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openPair = pairs.find(([b]) => b.getAttribute('aria-expanded') === 'true');
    if (openPair) {
      setOpen(openPair[0], openPair[1], false);
      openPair[0].focus();
    }
  });
}
