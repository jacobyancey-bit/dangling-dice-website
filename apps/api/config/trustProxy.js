/**
 * Reverse-proxy trust configuration (Cloudflare -> Render -> Express).
 *
 * Express walks X-Forwarded-For from right (closest hop) to left and returns the first address
 * it does NOT trust as req.ip. In `cloudflare` mode we trust only:
 *   - private / internal hops (Render's own load balancers), and
 *   - Cloudflare's published edge ranges.
 * The first public, non-Cloudflare address is therefore the real visitor. Spoofed XFF entries sit
 * further left than the address Cloudflare appended, so they are never reached. A client that
 * bypasses Cloudflare and hits the *.onrender.com origin directly gets its own real socket IP.
 *
 * Source: https://www.cloudflare.com/ips-v4 and /ips-v6 (cross-checked with
 * https://api.cloudflare.com/client/v4/ips). Fetched 2026-11-27. These change rarely; re-check yearly.
 */
export const CLOUDFLARE_IP_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

// loopback / linklocal / uniquelocal are proxy-addr presets (127/8, ::1, 169.254/16, fe80::/10,
// 10/8, 172.16/12, 192.168/16, fc00::/7). 100.64/10 covers carrier-grade NAT used by some PaaS meshes.
const INTERNAL_HOPS = ['loopback', 'linklocal', 'uniquelocal', '100.64.0.0/10'];

/**
 * Maps the TRUST_PROXY env value to an Express 'trust proxy' setting.
 *   ''/undefined -> undefined (leave Express default: trust nothing)
 *   'cloudflare' -> internal hops + Cloudflare edge ranges (recommended in production)
 *   '1', '2', ... -> fixed hop count
 *   'true'/'false' -> boolean
 * @param {string|undefined} value
 */
export function resolveTrustProxy(value) {
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return undefined;
  if (v === 'cloudflare') return [...INTERNAL_HOPS, ...CLOUDFLARE_IP_RANGES];
  if (/^\d+$/.test(v)) return Number(v);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}
