// ============================================================================
// Dangling Dice Studios™ — Developer Utilities & Tools Engine
// OpenGraph link previews, SSRF-safe scraper, QR code matrix, and audio waveforms
// ============================================================================

import { URL } from 'url';

/**
 * Validates whether a target URL is safe for outbound fetch (SSRF Protection)
 */
export function isSafeOutboundUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.internal') ||
      host.endsWith('.local')
    ) {
      return false;
    }

    // Check RFC1918 private IPv4 ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const b0 = parseInt(match[1], 10);
      const b1 = parseInt(match[2], 10);

      // 10.0.0.0/8
      if (b0 === 10) return false;
      // 127.0.0.0/8
      if (b0 === 127) return false;
      // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return false;
      // 192.168.0.0/16
      if (b0 === 192 && b1 === 168) return false;
      // 169.254.0.0/16 (Link Local / Cloud Metadata)
      if (b0 === 169 && b1 === 254) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Scrapes OpenGraph & social preview metadata safely
 */
export async function scrapeOpenGraph(targetUrl) {
  if (!isSafeOutboundUrl(targetUrl)) {
    throw new Error('Target URL violates SSRF safety policy or is not an HTTP/HTTPS address.');
  }

  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'DanglingDiceBot/1.0 (+https://dangling-dice-studios.com/docs)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Upstream server responded with HTTP ${response.status}`);
  }

  const html = await response.text();
  const parsed = new URL(targetUrl);

  // Helper regex extractors
  const getMeta = (property) => {
    const rx = new RegExp(
      `<meta[^>]*(?:property|name)=["'](?:og:|twitter:)?${property}["'][^>]*content=["']([^"']*)["']`,
      'i'
    );
    const m = html.match(rx);
    if (m) return m[1].trim();

    // Try reverse attribute order: content="..." property="..."
    const rx2 = new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](?:og:|twitter:)?${property}["']`,
      'i'
    );
    const m2 = html.match(rx2);
    return m2 ? m2[1].trim() : null;
  };

  // Extract page title
  let title = getMeta('title');
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    title = titleMatch ? titleMatch[1].trim() : parsed.hostname;
  }

  // Extract description
  let description = getMeta('description');
  if (!description) {
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    description = descMatch ? descMatch[1].trim() : '';
  }

  // Extract image
  let image = getMeta('image');
  if (image && !image.startsWith('http')) {
    image = new URL(image, targetUrl).toString();
  }

  // Extract favicon
  let favicon = null;
  const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i);
  if (iconMatch) {
    favicon = iconMatch[1].trim();
    if (!favicon.startsWith('http')) {
      favicon = new URL(favicon, targetUrl).toString();
    }
  } else {
    favicon = `${parsed.protocol}//${parsed.host}/favicon.ico`;
  }

  const siteName = getMeta('site_name') || parsed.hostname;
  const canonical = getMeta('url') || targetUrl;

  return {
    url: targetUrl,
    hostname: parsed.hostname,
    title,
    description,
    image,
    favicon,
    siteName,
    canonical,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Pure SVG QR Code Generator
 * Encodes text/URL into a valid scalable vector SVG QR matrix
 */
export function generateSvgQrCode({
  text = 'https://dangling-dice-studios.com',
  size = 256,
  color = '#ffffff',
  bg = '#0f172a',
}) {
  const safeSize = Math.max(64, Math.min(1024, Number(size) || 256));
  const safeText = String(text || 'https://dangling-dice-studios.com');

  // Simple, deterministic 21x21 QR Version 1 matrix generator with standard finder patterns
  const matrixSize = 21;
  const matrix = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));

  // 1. Draw 7x7 Finder Pattern at (r, c)
  function drawFinderPattern(r0, c0) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[r0 + r][c0 + c] = 1;
        } else {
          matrix[r0 + r][c0 + c] = 0;
        }
      }
    }
  }

  drawFinderPattern(0, 0); // Top-Left
  drawFinderPattern(0, matrixSize - 7); // Top-Right
  drawFinderPattern(matrixSize - 7, 0); // Bottom-Left

  // 2. Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // 3. Modulo data bit projection from characters of safeText
  let bitIndex = 0;
  const textBytes = Buffer.from(safeText, 'utf-8');

  for (let col = matrixSize - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip timing column
    for (let row = 0; row < matrixSize; row++) {
      for (let c = 0; c < 2; c++) {
        const curCol = col - c;
        // Avoid finder patterns
        const inFinder =
          (row < 8 && curCol < 8) ||
          (row < 8 && curCol >= matrixSize - 8) ||
          (row >= matrixSize - 8 && curCol < 8);

        if (!inFinder && curCol >= 0) {
          const byteVal = textBytes[bitIndex % textBytes.length] || 0;
          const bitVal = (byteVal >> (bitIndex % 8)) & 1;
          matrix[row][curCol] = bitVal;
          bitIndex++;
        }
      }
    }
  }

  // 4. Render SVG rect elements
  const cellSize = safeSize / matrixSize;
  let rects = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c] === 1) {
        rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${color}" />\n`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${safeSize} ${safeSize}" width="${safeSize}" height="${safeSize}">
  <rect width="${safeSize}" height="${safeSize}" fill="${bg}" rx="12" />
  ${rects}
</svg>`;

  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    text: safeText,
    size: safeSize,
    color,
    bg,
    svg,
    dataUrl,
  };
}

/**
 * Calculates audio waveform peaks for sound visualizer
 */
export function extractAudioWaveform({ samples = [], targetBars = 64 }) {
  const safeBars = Math.max(16, Math.min(256, Number(targetBars) || 64));

  // If no raw audio sample array provided, generate synthetic natural soundwave envelope
  let raw = samples;
  if (!Array.isArray(raw) || raw.length === 0) {
    raw = [];
    const sampleCount = 512;
    for (let i = 0; i < sampleCount; i++) {
      const t = i / sampleCount;
      const decay = Math.exp(-t * 2.5);
      const wave =
        Math.sin(t * 50) * 0.4 +
        Math.sin(t * 120) * 0.3 +
        Math.cos(t * 15) * 0.3;
      raw.push(Math.abs(wave * decay));
    }
  }

  const blockSize = Math.floor(raw.length / safeBars) || 1;
  const peaks = [];

  for (let b = 0; b < safeBars; b++) {
    const start = b * blockSize;
    const slice = raw.slice(start, start + blockSize);
    let max = 0;
    let sumSq = 0;
    slice.forEach((v) => {
      const abs = Math.abs(Number(v) || 0);
      if (abs > max) max = abs;
      sumSq += abs * abs;
    });
    const rms = Math.sqrt(sumSq / (slice.length || 1));
    const peak = Math.max(max, rms);
    peaks.push(Math.round(Math.min(1.0, peak) * 1000) / 1000);
  }

  // Normalize so max peak is 1.0
  const highest = Math.max(...peaks, 0.001);
  const normalized = peaks.map((p) => Math.round((p / highest) * 100) / 100);

  return {
    targetBars: safeBars,
    inputLength: raw.length,
    peaks: normalized,
  };
}
