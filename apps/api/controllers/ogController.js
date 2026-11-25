/**
 * Dynamic OpenGraph / Social Share Preview Card Generator
 * Returns scalable, zero-dependency SVG cards (1200x630) optimized for
 * Discord, Twitter/X summary_large_image, Facebook, LinkedIn & iMessage.
 */

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const generateOgCard = (req, res) => {
  const {
    title = 'Dangling Dice Studios™',
    subtitle = 'Where Beat Production Meets Code Craft, Phone Apps, and Developer Tools',
    badge = 'STUDIO ECOSYSTEM',
    theme = 'cyan',
  } = req.query;

  const safeTitle = String(title).slice(0, 65);
  const safeSubtitle = String(subtitle).slice(0, 110);
  const safeBadge = String(badge).slice(0, 28).toUpperCase();

  const themeColors = {
    cyan: { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', bgGradient: '#0f172a' },
    purple: { primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)', bgGradient: '#1e1b4b' },
    gold: { primary: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', bgGradient: '#291e05' },
    pink: { primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)', bgGradient: '#3b0724' },
    emerald: { primary: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', bgGradient: '#062e22' },
  };

  const selectedTheme = themeColors[theme] || themeColors.cyan;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bgGlow" cx="20%" cy="30%" r="80%">
      <stop offset="0%" stop-color="${selectedTheme.glow}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#04060b" stop-opacity="1" />
    </radialGradient>
    <linearGradient id="borderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${selectedTheme.primary}" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${selectedTheme.primary}" stop-opacity="0.8" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#04060b" />
  <rect width="1200" height="630" fill="url(#bgGlow)" />
  <rect x="24" y="24" width="1152" height="582" rx="28" fill="none" stroke="url(#borderGlow)" stroke-width="2" />
  
  <!-- Header Brand Pill Badge -->
  <g transform="translate(80, 80)">
    <rect width="260" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="${selectedTheme.primary}" stroke-width="1.5" />
    <text x="25" y="27" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-weight="700" font-size="15" fill="${selectedTheme.primary}" letter-spacing="2">${escapeXml(safeBadge)}</text>
  </g>

  <!-- Main Title -->
  <text x="80" y="250" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-weight="800" font-size="54" fill="#f8fafc" letter-spacing="-1">
    ${escapeXml(safeTitle)}
  </text>

  <!-- Subtitle -->
  <text x="80" y="330" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-weight="400" font-size="24" fill="#94a3b8">
    ${escapeXml(safeSubtitle)}
  </text>

  <!-- Feature Tags Row -->
  <g transform="translate(80, 410)">
    <rect width="180" height="36" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
    <text x="20" y="23" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" fill="#cbd5e1">⚡ Sub-15ms Speed</text>
    <g transform="translate(195, 0)">
      <rect width="180" height="36" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
      <text x="20" y="23" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" fill="#cbd5e1">🔒 100% Zero-Log</text>
    </g>
    <g transform="translate(390, 0)">
      <rect width="180" height="36" rx="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
      <text x="20" y="23" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" fill="#cbd5e1">🌐 Full Open Source</text>
    </g>
  </g>

  <!-- Footer Brand Bar -->
  <g transform="translate(80, 525)">
    <text x="0" y="28" font-size="30">🎲</text>
    <text x="45" y="26" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="24" fill="#ffffff">
      Dangling <tspan fill="${selectedTheme.primary}">Dice Studios™</tspan>
    </text>
    <text x="760" y="26" font-family="'Consolas', monospace" font-size="17" fill="#64748b">
      dangling-dice-studios.com
    </text>
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  return res.send(svg);
};
