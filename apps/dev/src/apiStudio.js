// ============================================================================
// Dangling Dice Dev Suite™ — API Studio Module
// Glass-Box API Runner, Multi-Language Code Generator, & Webhook Inspector
// Targets the dedicated API Gateway at https://api.dangling-dice-studios.com
// ============================================================================

export const API_GATEWAY_URL =
  window.location.hostname.includes('localhost')
    ? 'http://localhost:5000'
    : 'https://api.dangling-dice-studios.com';

export const API_ENDPOINTS = [
  {
    id: 'tutor_calculator',
    name: 'AI Tutor & Formula Evaluator',
    method: 'POST',
    path: '/v1/compute/calculator',
    category: 'Railway Microservices',
    desc: 'High-precision algebraic solver, formula step evaluator, and STEM math computation engine.',
    payload: {
      expression: '3*x^2 + 5*x - 12 = 0',
      operation: 'solve_roots',
      precision: 4,
    },
  },
  {
    id: 'daas_scraper',
    name: 'DAAS Multi-Agent Web Scraper',
    method: 'POST',
    path: '/v1/compute/scraper',
    category: 'Railway Microservices',
    desc: 'Headless multi-agent scraper with structured JSON extraction, bot defense bypass, and schema mapping.',
    payload: {
      targetUrl: 'https://news.ycombinator.com',
      fields: ['headline', 'points', 'commentCount'],
      bypassAntiBot: true,
    },
  },
  {
    id: 'schema_infer',
    name: 'Infer TypeScript & Zod Schema',
    method: 'POST',
    path: '/v1/schema/infer',
    category: 'Schema Engine',
    desc: 'Infers TypeScript interface, Zod validator, and PostgreSQL DDL from arbitrary JSON in sub-15ms.',
    payload: {
      rootName: 'UserAccount',
      jsonInput: {
        id: 'usr_7f8a9b0c',
        email: 'dev@dangling-dice-studios.com',
        role: 'admin',
        credits: 5000,
        settings: {
          notifications: true,
          theme: 'dark',
        },
      },
    },
  },
  {
    id: 'geo_parcel',
    name: 'GIS Land Parcel Boundary & Acreage',
    method: 'POST',
    path: '/v1/geo/parcel-metrics',
    category: 'Geo & Network Engine',
    desc: 'Calculates geodesic acreage, perimeter in meters/feet, and bounding box from polygon coordinates.',
    payload: {
      coordinates: [
        [-86.7816, 36.1627],
        [-86.7796, 36.1627],
        [-86.7796, 36.1642],
        [-86.7816, 36.1642],
      ],
    },
  },
  {
    id: 'privacy_redact',
    name: 'Luhn Credit Card & PII Data Redactor',
    method: 'POST',
    path: '/v1/privacy/redact',
    category: 'Privacy Engine',
    desc: 'Detects and masks valid Luhn credit cards, SSNs, phone numbers, and emails with HIPAA/PCI compliance.',
    payload: {
      mode: 'mask',
      text: 'Order 9042 from customer jacob@dangling-dice-studios.com, phone (615) 555-0199, card 4532-0150-1234-5678.',
    },
  },
  {
    id: 'finance_amort',
    name: 'Penny-Accurate Loan Amortization',
    method: 'POST',
    path: '/v1/finance/amortization',
    category: 'Finance Engine',
    desc: 'Simulates monthly payment schedules, cumulative interest, and principal amortization curves.',
    payload: {
      principal: 300000,
      annualRatePercent: 6.5,
      termMonths: 360,
    },
  },
  {
    id: 'finance_compound',
    name: 'Compound Wealth Growth Simulator',
    method: 'POST',
    path: '/v1/finance/compound-interest',
    category: 'Finance Engine',
    desc: 'Calculates future value with recurring monthly deposits, compounding frequency, and inflation tracking.',
    payload: {
      initialPrincipal: 10000,
      monthlyDeposit: 500,
      annualReturnPercent: 8.5,
      years: 15,
    },
  },
  {
    id: 'music_progression',
    name: 'Chord Progression & Voicing Generator',
    method: 'POST',
    path: '/v1/music/progression',
    category: 'Music Engine',
    desc: 'Synthesizes jazz, lo-fi, trap, and neo-soul chord progressions with MIDI note arrays, Roman numerals, and Hz frequencies.',
    payload: {
      preset: 'lofi_chill',
      key: 'Eb',
      baseOctave: 3,
    },
  },
  {
    id: 'music_scale',
    name: 'Scale, Modal Intervals & Fretboard Solver',
    method: 'GET',
    path: '/v1/music/scale?root=C&scale=dorian&tuning=guitar_standard',
    category: 'Music Engine',
    desc: 'Calculates all scale degrees, frequencies across octaves, and exact string-and-fret coordinates for guitar and bass.',
    payload: null,
  },
  {
    id: 'music_delay',
    name: 'BPM Delay & Acoustic Reverb Pre-Delay',
    method: 'GET',
    path: '/v1/music/delay-calc?bpm=128',
    category: 'Music Engine',
    desc: 'Computes straight, dotted, and triplet delay ms and Hz for all note divisions, plus room reverb acoustic pre-delays.',
    payload: null,
  },
  {
    id: 'games_dice',
    name: 'Provably Fair Cryptographic Dice Engine',
    method: 'POST',
    path: '/v1/games/dice/roll',
    category: 'Gaming Engine',
    desc: 'Rolls dice using client-seeded HMAC-SHA256 with verifiable mathematical proof of non-tampering.',
    payload: {
      count: 2,
      sides: 20,
      clientSeed: 'player_seed_alpha',
      nonce: 1,
    },
  },
  {
    id: 'games_leaderboard',
    name: 'Global Leaderboard & High Score Submission',
    method: 'POST',
    path: '/v1/games/leaderboard/submit',
    category: 'Gaming Engine',
    desc: 'Submits verified player high scores and returns updated global standings with rank positioning.',
    payload: {
      gameId: 'dice_battles',
      playerName: 'PlayerOne',
      score: 4850,
      level: 12,
      metadata: { character: 'Wizard', difficulty: 'Hard' },
    },
  },
  {
    id: 'tools_opengraph',
    name: 'OpenGraph Link Preview & Social Metadata Scraper',
    method: 'GET',
    path: '/v1/tools/opengraph?url=https://github.com',
    category: 'Tools Engine',
    desc: 'Scrapes social preview cards, OpenGraph tags, favicons, and Twitter metadata with built-in SSRF protection.',
    payload: null,
  },
  {
    id: 'tools_qrcode',
    name: 'Customizable Vector SVG QR Code Generator',
    method: 'GET',
    path: '/v1/tools/qrcode?text=https://dangling-dice-studios.com&size=256&color=10b981&bg=0f172a',
    category: 'Tools Engine',
    desc: 'Generates zero-dependency scalable SVG QR codes with custom colors and Data URL embeds.',
    payload: null,
  },
  {
    id: 'tools_shorten',
    name: 'Branded URL Shortener & Click Analytics',
    method: 'POST',
    path: '/v1/tools/shorten',
    category: 'Tools Engine',
    desc: 'Creates short links with automatic 302 redirection tracking and click counts.',
    payload: {
      targetUrl: 'https://dangling-dice-studios.com/beats',
      title: 'Dangling Beats Studio',
    },
  },
  {
    id: 'media_waveform',
    name: 'Audio Waveform Peak & Visualizer Engine',
    method: 'POST',
    path: '/v1/media/waveform',
    category: 'Media Engine',
    desc: 'Extracts normalized RMS and peak bar points for rendering audio soundwaves in web and mobile apps.',
    payload: {
      targetBars: 64,
    },
  },
  {
    id: 'auth_keys',
    name: 'Developer API Key Generation & Quota Allocation',
    method: 'POST',
    path: '/v1/auth/keys',
    category: 'Developer Platform',
    desc: 'Issues a cryptographically secure dds_live_ API key with monthly rate limits and quota tracking.',
    payload: {
      ownerEmail: 'developer@example.com',
      name: 'Mobile App Client',
      tier: 'pro',
    },
  },
  {
    id: 'media_convert',
    name: 'Extract MP3 Audio Stream from Video',
    method: 'POST',
    path: '/media/convert',
    category: 'Media Engine',
    desc: 'Resolves YouTube video audio pipelines into direct 320kbps MP3 streams with CORS headers.',
    payload: {
      url: 'https://www.youtube.com/watch?v=2J-U0EUATHs',
      format: 'mp3',
      quality: '320',
    },
  },
  {
    id: 'gateway_health',
    name: 'API Gateway Health & Engine Inventory',
    method: 'GET',
    path: '/v1/health',
    category: 'Telemetry',
    desc: 'Returns live cluster telemetry, active microservice engine inventory, and uptime counters.',
    payload: null,
  },
  {
    id: 'openapi_spec',
    name: 'Machine-Readable OpenAPI 3.0 Specification',
    method: 'GET',
    path: '/openapi.json',
    category: 'Documentation',
    desc: 'Official OpenAPI 3.0.3 spec ready for Swagger UI, Postman collections, and SDK generators.',
    payload: null,
  },
];

export const WEBHOOK_PRESETS = [
  {
    id: 'order_created',
    event: 'order.completed',
    payload: {
      id: 'evt_9981a',
      event: 'order.completed',
      timestamp: new Date().toISOString(),
      data: {
        orderId: 'ord_live_4492',
        customerEmail: 'creator@dangling-dice-studios.com',
        amountCents: 2500,
        currency: 'usd',
        items: ['Studio Beat License - Lo-Fi Drive #1'],
      },
    },
  },
  {
    id: 'media_converted',
    event: 'media.converted',
    payload: {
      id: 'evt_9982b',
      event: 'media.converted',
      timestamp: new Date().toISOString(),
      data: {
        jobId: 'job_transcode_771',
        sourceUrl: 'https://youtube.com/watch?v=...',
        format: 'mp3',
        bitrateKbps: 320,
        fileSizeBytes: 9481220,
      },
    },
  },
];

/**
 * Computes an HMAC-SHA256 hex digest using Web Crypto API
 */
export async function computeHmacSha256(secret, payloadString) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payloadString));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates copy-paste code snippets in multiple programming languages
 */
export function generateCodeSnippets(endpoint, payload) {
  const fullUrl = `${API_GATEWAY_URL}${endpoint.path}`;
  const payloadStr = payload ? JSON.stringify(payload, null, 2) : '';

  const curl =
    endpoint.method === 'GET'
      ? `curl -X GET "${fullUrl}" \\\n  -H "Accept: application/json"`
      : `curl -X POST "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(
          payload
        )}'`;

  const nodeTs =
    endpoint.method === 'GET'
      ? `// Node.js (v18+) / TypeScript
const res = await fetch('${fullUrl}', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
  },
});
const data = await res.json();
console.log(data);`
      : `// Node.js (v18+) / TypeScript
const res = await fetch('${fullUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${payloadStr}),
});
const data = await res.json();
console.log(data);`;

  const python =
    endpoint.method === 'GET'
      ? `# Python 3.8+ (requests)
import requests

url = "${fullUrl}"
headers = {"Accept": "application/json"}

res = requests.get(url, headers=headers)
print(res.status_code, res.json())`
      : `# Python 3.8+ (requests)
import requests

url = "${fullUrl}"
payload = ${JSON.stringify(payload, null, 4)}

res = requests.post(url, json=payload)
print(res.status_code, res.json())`;

  const dart =
    endpoint.method === 'GET'
      ? `// Dart / Flutter
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> fetchTelemetry() async {
  final url = Uri.parse('${fullUrl}');
  final res = await http.get(url, headers: {'Accept': 'application/json'});
  final data = jsonDecode(res.body);
  print(data);
}`
      : `// Dart / Flutter
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> executeCompute() async {
  final url = Uri.parse('${fullUrl}');
  final res = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode(${payloadStr}),
  );
  final data = jsonDecode(res.body);
  print(data);
}`;

  return { curl, nodeTs, python, dart };
}

