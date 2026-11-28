/**
 * WAI-ARIA tabs keyboard support: Left/Right arrows move between tabs (wrapping), Home/End jump
 * to the ends, and the newly focused tab is activated (automatic activation).
 *
 *   import { initTabKeyboard } from '@dangling-dice/shared';
 *   initTabKeyboard(document.getElementById('sandboxes'));
 *
 * The listener is delegated to the tablist container, so tabs may be re-rendered freely.
 * Each tab still needs role="tab", aria-selected and a roving tabindex (0 on the active tab,
 * -1 on the rest); the page's click handler does the actual switching.
 */
export function initTabKeyboard(list) {
  if (!list) return;
  list.addEventListener('keydown', (e) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    next.focus();
    next.click();
  });
}
