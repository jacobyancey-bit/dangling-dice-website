/**
 * Stroke icons (Lucide, ISC) rendered at the design system's 1.5px stroke.
 * Replaces emoji in headings, buttons, badges and navigation.
 *
 *   import { icon } from '@dangling-dice/shared/icons';
 *   button.innerHTML = `${icon('download')} Download`;
 *   icon('circle-check', { label: 'Online' })  // meaningful icon -> announced to screen readers
 *
 * Decorative by default (aria-hidden). Pass { label } when the icon carries meaning on its own.
 */
import { ICON_PATHS } from './icons.generated.js';

const escapeAttr = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function icon(name, { label = '', size, className = '' } = {}) {
  const inner = ICON_PATHS[name];
  if (!inner) {
    if (typeof console !== 'undefined') console.warn(`[icons] Unknown icon "${name}" — add it to scripts/build-icons.js`);
    return '';
  }
  const a11y = label ? `role="img" aria-label="${escapeAttr(label)}"` : 'aria-hidden="true" focusable="false"';
  const dims = size ? ` width="${Number(size)}" height="${Number(size)}"` : '';
  const cls = `icon icon-${name}${className ? ' ' + escapeAttr(className) : ''}`;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"${dims} ${a11y}>${inner}</svg>`;
}

export const ICON_NAMES = Object.keys(ICON_PATHS);
