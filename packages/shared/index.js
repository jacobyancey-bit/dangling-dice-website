/**
 * @fileoverview Shared Domain Contracts, Constants, and Schema Definitions.
 * Acts as the Single Source of Truth (SSOT) across all Dangling Dice Studios apps.
 */

import { icon } from './icons.js';

export { icon } from './icons.js';
export { initStudioShell } from './shell.js';

export const ITEM_CATEGORIES = [
  'Coding Tutorials',
  'Beats & Audio',
  'Mobile Apps',
  'Studio Games',
  'Developer Tools',
  'General',
];

export const USER_ROLES = ['user', 'admin'];

export const STUDIO_DIVISIONS = [
  {
    id: 'beats',
    name: 'Dangling Beats Studio',
    tagline: 'Lofi, dark trap, and synthwave productions for creators & streamers',
    category: 'Beats & Audio',
  },
  {
    id: 'apps',
    name: 'Mobile Apps & AI Utilities',
    tagline: 'Smart Android productivity utilities, including the AI Calculator on Google Play',
    category: 'Mobile Apps',
  },
  {
    id: 'coding',
    name: 'Dangling Dice Coding',
    tagline: 'Full-stack engineering, interactive game dev, and secure web tutorials',
    category: 'Coding Tutorials',
  },
  {
    id: 'games',
    name: 'Studio Games & RPG Tools',
    tagline: 'Custom tabletop RPG companions, digital dice rollers, and interactive developer assets',
    category: 'Studio Games',
  },
];

/**
 * Developer Tool Classifications
 */
export const TOOL_TYPES = [
  'web-utility',
  'standalone-app',
  'mobile-companion',
  'api-service',
];

/**
 * Universal Progressive Web App (PWA) Service Worker Initializer
 */
export function initPwaServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.debug('[PWA] Service worker registration skipped:', err.message);
      });
    });
  }
}

/**
 * Universal Staff Gate & Command Palette Engine (Ctrl+K / Cmd+K)
 * Hidden by default from normal users.
 * Unlocks via secret query ?staff=dds_internal, Ctrl+Shift+D, or clicking logo 5 times.
 */
export function initStaffCommandPalette() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const STAFF_STORAGE_KEY = 'dds_staff_mode';

  // 1. Secret URL Query Trigger
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('staff') === 'dds_internal' || urlParams.get('preview') === 'staff' || urlParams.get('admin') === '1') {
      localStorage.setItem(STAFF_STORAGE_KEY, 'true');
      urlParams.delete('staff');
      urlParams.delete('preview');
      urlParams.delete('admin');
      const newQuery = urlParams.toString();
      const cleanUrl = window.location.pathname + (newQuery ? '?' + newQuery : '') + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      setTimeout(() => {
        if (typeof window.showToast === 'function') {
          window.showToast('🎲 Staff Access Mode Unlocked (Private Preview Enabled)', 'success');
        }
      }, 300);
    }
  } catch {}

  function isStaff() {
    return localStorage.getItem(STAFF_STORAGE_KEY) === 'true';
  }

  function toggleStaffMode() {
    const nextState = !isStaff();
    if (nextState) {
      localStorage.setItem(STAFF_STORAGE_KEY, 'true');
      if (typeof window.showToast === 'function') {
        window.showToast('🎲 Staff Access Mode Unlocked (Private Preview Enabled)', 'success');
      }
      mountPalette();
      updateRailItem();
      toggleStaffSections(true);
    } else {
      localStorage.removeItem(STAFF_STORAGE_KEY);
      if (typeof window.showToast === 'function') {
        window.showToast('🔒 Staff Mode Locked (Public View)', 'info');
      }
      closePalette();
      updateRailItem();
      toggleStaffSections(false);
    }
  }

  // 2. Secret Logo Click Trigger (5 clicks in 2.5s)
  let clickCount = 0;
  let clickTimer = null;
  const setupLogoTrigger = () => {
    const brandEls = document.querySelectorAll('.dds-shell-brand, .brand');
    brandEls.forEach((el) => {
      el.addEventListener('click', (e) => {
        clickCount++;
        clearTimeout(clickTimer);
        if (clickCount >= 5) {
          e.preventDefault();
          clickCount = 0;
          toggleStaffMode();
          return;
        }
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 2500);
      });
    });
  };

  // 3. Mount / Remove the staff entry in the shell's top bar (staff only; never rendered for the public)
  function updateRailItem() {
    const slot = document.getElementById('ddsShellStaffSlot');
    let staffItem = document.getElementById('ddsShellStaffBtn');

    if (isStaff()) {
      if (!staffItem && slot) {
        staffItem = document.createElement('button');
        staffItem.type = 'button';
        staffItem.id = 'ddsShellStaffBtn';
        staffItem.className = 'dds-shell-link dds-shell-staff';
        staffItem.title = 'Staff command palette (Ctrl+K)';
        staffItem.innerHTML = `${icon('command')}<span>Staff</span><kbd>Ctrl K</kbd>`;
        staffItem.addEventListener('click', (e) => {
          e.preventDefault();
          openPalette();
        });
        slot.appendChild(staffItem);
      }
    } else if (staffItem) {
      staffItem.remove();
    }
  }

  // 4. Toggle Staff-Only Sections in the Page (like Sandbox Playground in dev hub)
  function toggleStaffSections(active) {
    document.querySelectorAll('[data-staff-only="true"], #staffSandboxPlayground').forEach((el) => {
      el.style.display = active ? '' : 'none';
    });
  }

  // 5. Palette DOM Setup
  let backdrop = null;
  let input = null;
  let list = null;
  let activeIndex = 0;
  let filteredActions = [];

  const COMMANDS = [
    // Navigation
    { id: 'nav-hq', group: 'Studio Hubs', title: 'Main Studio HQ', icon: 'house', tag: 'HUB', action: () => { window.location.href = 'https://dangling-dice-studios.com/'; } },
    { id: 'nav-beats', group: 'Studio Hubs', title: 'Beats Studio & DAW', icon: 'music', tag: 'HUB', action: () => { window.location.href = 'https://beats.dangling-dice-studios.com/'; } },
    { id: 'nav-games', group: 'Studio Hubs', title: 'Gaming Hub & OmniSound', icon: 'gamepad-2', tag: 'HUB', action: () => { window.location.href = 'https://games.dangling-dice-studios.com/'; } },
    { id: 'nav-media', group: 'Studio Hubs', title: 'Media Converter Hub', icon: 'audio-waveform', tag: 'HUB', action: () => { window.location.href = 'https://media.dangling-dice-studios.com/'; } },
    { id: 'nav-dev', group: 'Studio Hubs', title: 'Developer Hub & APIs', icon: 'code', tag: 'HUB', action: () => { window.location.href = 'https://dev.dangling-dice-studios.com/'; } },
    // Staff Diagnostics & Railway
    {
      id: 'staff-sandbox',
      group: 'Railway & Staff Diagnostics',
      title: 'Open Railway Live Sandbox Console',
      icon: 'terminal',
      tag: 'RAILWAY',
      action: () => {
        closePalette();
        const playground = document.getElementById('staffSandboxPlayground');
        if (playground) {
          playground.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.location.href = 'https://dev.dangling-dice-studios.com/#staffSandboxPlayground';
        }
      },
    },
    {
      id: 'staff-ping-api',
      group: 'Railway & Staff Diagnostics',
      title: 'Ping Central API Health & Latency',
      icon: 'activity',
      tag: 'TELEMETRY',
      action: async () => {
        closePalette();
        const t0 = performance.now();
        try {
          const res = await fetch('https://dangling-dice-studios.com/api', { signal: AbortSignal.timeout(4000) });
          const latency = Math.round(performance.now() - t0);
          const data = await res.json();
          if (typeof window.showToast === 'function') {
            window.showToast(`⚡ Central API ${data.status.toUpperCase()} (${latency}ms) — DB: ${data.database?.status}`, 'success');
          }
        } catch (err) {
          if (typeof window.showToast === 'function') {
            window.showToast(`❌ API Health Ping Failed: ${err.message}`, 'error');
          }
        }
      },
    },
    {
      id: 'staff-toast-demo',
      group: 'Railway & Staff Diagnostics',
      title: 'Fire toast demo',
      icon: 'info',
      tag: 'UI/UX',
      action: () => {
        closePalette();
        if (typeof window.showToast === 'function') {
          window.showToast('✨ High-Performance Glassmorphism Toast Active!', 'success');
        }
      },
    },
    {
      id: 'staff-clear-cache',
      group: 'Railway & Staff Diagnostics',
      title: 'Flush Local Storage & Studio Stash',
      icon: 'trash-2',
      tag: 'DEV',
      action: () => {
        closePalette();
        try {
          localStorage.removeItem('dds_stash');
          localStorage.removeItem('dds_persona');
          if (typeof window.showToast === 'function') {
            window.showToast('🧹 Local stash and persona preferences cleared', 'info');
          }
        } catch {}
      },
    },
    {
      id: 'staff-lock',
      group: 'Staff Security',
      title: 'Lock Staff Mode (Exit Private Preview)',
      icon: 'lock',
      tag: 'SECURITY',
      action: () => {
        toggleStaffMode();
      },
    },
  ];

  function mountPalette() {
    if (document.getElementById('ddsStaffPaletteBackdrop')) return;

    backdrop = document.createElement('div');
    backdrop.id = 'ddsStaffPaletteBackdrop';
    backdrop.className = 'dds-palette-backdrop';
    backdrop.innerHTML = `
      <div class="dds-palette-modal" role="dialog" aria-modal="true" aria-label="Staff Command Palette">
        <div class="dds-palette-header">
          <span class="dds-palette-search-icon">${icon('search')}</span>
          <input type="text" class="dds-palette-input" placeholder="Type a command or search hub... (Esc to close)" />
          <span class="dds-palette-esc">ESC</span>
        </div>
        <div class="dds-palette-list" id="ddsPaletteList"></div>
        <div class="dds-palette-footer">
          <div class="dds-palette-footer-keys">
            <span><strong>↑↓</strong> Navigate</span>
            <span><strong>↵</strong> Select</span>
            <span><strong>Esc</strong> Close</span>
          </div>
          <span class="dds-palette-badge-staff">STAFF PRIVATE PREVIEW</span>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    input = backdrop.querySelector('.dds-palette-input');
    list = backdrop.querySelector('#ddsPaletteList');

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closePalette();
    });

    // Input search filter
    input.addEventListener('input', () => {
      renderList(input.value.trim().toLowerCase());
    });

    // Keyboard navigation inside input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePalette();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredActions.length > 0) {
          activeIndex = (activeIndex + 1) % filteredActions.length;
          highlightActive();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredActions.length > 0) {
          activeIndex = (activeIndex - 1 + filteredActions.length) % filteredActions.length;
          highlightActive();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[activeIndex]) {
          filteredActions[activeIndex].action();
        }
      }
    });
  }

  function renderList(query = '') {
    if (!list) return;
    list.innerHTML = '';
    filteredActions = COMMANDS.filter((cmd) => {
      if (!query) return true;
      return cmd.title.toLowerCase().includes(query) || cmd.group.toLowerCase().includes(query) || cmd.tag.toLowerCase().includes(query);
    });

    if (filteredActions.length === 0) {
      list.innerHTML = `<div class="dds-palette-empty">No matching commands found.</div>`;
      return;
    }

    let lastGroup = null;
    filteredActions.forEach((cmd, idx) => {
      if (cmd.group !== lastGroup) {
        lastGroup = cmd.group;
        const groupEl = document.createElement('div');
        groupEl.className = 'dds-palette-group-title';
        groupEl.textContent = cmd.group;
        list.appendChild(groupEl);
      }

      const itemEl = document.createElement('div');
      itemEl.className = `dds-palette-item ${idx === activeIndex ? 'active' : ''}`;
      itemEl.setAttribute('data-index', idx);
      itemEl.innerHTML = `
        <div class="dds-palette-item-left">
          <span class="dds-palette-item-icon">${icon(cmd.icon)}</span>
          <span>${cmd.title}</span>
        </div>
        <span class="dds-palette-item-tag">${cmd.tag}</span>
      `;

      itemEl.addEventListener('mouseenter', () => {
        activeIndex = idx;
        highlightActive();
      });

      itemEl.addEventListener('click', () => {
        cmd.action();
      });

      list.appendChild(itemEl);
    });

    highlightActive();
  }

  function highlightActive() {
    if (!list) return;
    const items = list.querySelectorAll('.dds-palette-item');
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }

  function openPalette() {
    if (!isStaff()) return;
    mountPalette();
    renderList('');
    activeIndex = 0;
    backdrop.classList.add('open');
    setTimeout(() => {
      if (input) {
        input.value = '';
        input.focus();
      }
    }, 50);
  }

  function closePalette() {
    if (backdrop) {
      backdrop.classList.remove('open');
    }
  }

  function togglePalette() {
    if (backdrop && backdrop.classList.contains('open')) {
      closePalette();
    } else {
      openPalette();
    }
  }

  // 6. Global Key Listeners
  window.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D or Cmd+Shift+D: Secret Toggle Staff Mode
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      toggleStaffMode();
      return;
    }

    // Ctrl+K or Cmd+K: Open Palette ONLY if staff mode is active
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      if (isStaff()) {
        e.preventDefault();
        togglePalette();
      }
    }
  });

  // Setup on page load
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      setupLogoTrigger();
      updateRailItem();
      toggleStaffSections(isStaff());
    });
  } else {
    setupLogoTrigger();
    updateRailItem();
    toggleStaffSections(isStaff());
  }

  // Expose global methods for staff
  window.openCommandPalette = openPalette;
  window.toggleStaffMode = toggleStaffMode;
}

/**
 * Curated Affiliate & Partner Categories
 */
export const AFFILIATE_CATEGORIES = [
  'Cloud Hosting & Databases',
  'Developer Utilities & IDEs',
  'Mobile & Android Dev',
  'Audio & Media Tech',
];

/**
 * Commercial Licensing Tiers for Dangling Beats & Digital Studio Assets.
 */
export const LICENSE_TIERS = {
  STANDARD_LEASE: {
    id: 'standard_lease',
    name: 'Standard MP3 Lease',
    description: 'Untagged MP3 audio, up to 100,000 streams, non-exclusive commercial rights.',
    defaultPriceUsd: 19.99,
  },
  PREMIUM_TRACKOUT: {
    id: 'premium_trackout',
    name: 'Premium WAV & Trackout',
    description: 'High-definition 24-bit WAV plus individual tracked-out stems for mixing.',
    defaultPriceUsd: 49.99,
  },
  EXCLUSIVE_RIGHTS: {
    id: 'exclusive_rights',
    name: 'Exclusive Studio Ownership',
    description: 'Full copyright transfer, unlimited broadcasting, removed from store.',
    defaultPriceUsd: 199.99,
  },
  DIGITAL_ASSET: {
    id: 'digital_asset',
    name: 'Standard Digital License',
    description: 'Single-seat commercial license for tools, sound kits, code templates, or RPG companions.',
    defaultPriceUsd: 9.99,
  },
};

export const ORDER_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

export const API_ENDPOINTS = {
  HEALTH: '/api',
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    PROFILE: '/api/auth/profile',
  },
  ITEMS: {
    BASE: '/api/items',
    BY_ID: (id) => `/api/items/${id}`,
  },
  CHECKOUT: {
    CREATE_SESSION: '/api/checkout/create-session',
    WEBHOOK: '/api/checkout/webhook',
  },
  ORDERS: {
    BASE: '/api/orders',
    BY_ID: (id) => `/api/orders/${id}`,
  },
};
