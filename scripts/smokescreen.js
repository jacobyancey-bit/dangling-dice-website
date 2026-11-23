#!/usr/bin/env node

/**
 * 💨 Dangling Dice Studios™ Production & Local Smokescreen Test CLI
 *
 * Runs end-to-end smoke verification across all 5 subdomains, API specs,
 * compute microservices, SEO discovery files, and affiliate redirect engines.
 *
 * Usage:
 *   node scripts/smokescreen.js           # Smoke test live production infrastructure
 *   node scripts/smokescreen.js --live    # Explicit live mode
 *   node scripts/smokescreen.js --local   # Smoke test localhost:5000
 */

const isLocal = process.argv.includes('--local');
const BASE_DOMAIN = isLocal ? 'http://localhost:5000' : 'https://dangling-dice-studios.com';

const TARGETS = [
  // 1. Multi-Tenant Subdomain Hubs
  {
    category: '🌐 Subdomains & Hubs',
    name: 'Main Studio Portal',
    url: isLocal ? `${BASE_DOMAIN}/` : 'https://dangling-dice-studios.com/',
    expectedStatus: 200,
    checkBody: (body) => body.includes('Dangling Dice Studios'),
  },
  {
    category: '🌐 Subdomains & Hubs',
    name: 'Games Hub (Subdomain)',
    url: isLocal ? `${BASE_DOMAIN}/?subdomain=games` : 'https://games.dangling-dice-studios.com/',
    expectedStatus: 200,
    checkBody: (body) => body.includes('OmniSound') || body.includes('gaming') || body.includes('Games'),
  },
  {
    category: '🌐 Subdomains & Hubs',
    name: 'Beats Hub (Subdomain)',
    url: isLocal ? `${BASE_DOMAIN}/?subdomain=beats` : 'https://beats.dangling-dice-studios.com/',
    expectedStatus: 200,
    checkBody: (body) => body.includes('Dangling Beats') || body.includes('Audio Lab'),
  },
  {
    category: '🌐 Subdomains & Hubs',
    name: 'Developer Hub (Subdomain)',
    url: isLocal ? `${BASE_DOMAIN}/?subdomain=dev` : 'https://dev.dangling-dice-studios.com/',
    expectedStatus: 200,
    checkBody: (body) => body.includes('Developer Hub') || body.includes('API'),
  },
  {
    category: '🌐 Subdomains & Hubs',
    name: 'Media Converter Hub (Subdomain)',
    url: isLocal ? `${BASE_DOMAIN}/?subdomain=media` : 'https://media.dangling-dice-studios.com/',
    expectedStatus: 200,
    checkBody: (body) => body.includes('Media') || body.includes('Converter'),
  },

  // 2. Machine API Gateway & Health
  {
    category: '⚡ API Gateway & Health',
    name: 'API Health Endpoint',
    url: isLocal ? `${BASE_DOMAIN}/health` : 'https://api.dangling-dice-studios.com/health',
    expectedStatus: 200,
    checkBody: (body) => body.includes('"status":"healthy"') || body.includes('"status":"ok"') || body.includes('healthy'),
  },
  {
    category: '⚡ API Gateway & Health',
    name: 'Public API Catalog Directory',
    url: isLocal ? `${BASE_DOMAIN}/api/affiliates` : 'https://api.dangling-dice-studios.com/api/affiliates',
    expectedStatus: 200,
    checkBody: (body) => body.includes('atlas') && (body.includes('amazon') || body.includes('gear-jbl-680nc')),
  },

  // 3. OpenAPI 3.0.3 Specs for Marketplace
  {
    category: '📜 OpenAPI Microservice Specs',
    name: 'Central OpenAPI Spec',
    url: isLocal ? `${BASE_DOMAIN}/openapi.json` : 'https://api.dangling-dice-studios.com/openapi.json',
    expectedStatus: 200,
    checkBody: (body) => body.includes('"openapi"') && body.includes('3.0'),
  },
  {
    category: '📜 OpenAPI Microservice Specs',
    name: 'Privacy & PII Redactor Spec',
    url: isLocal ? `${BASE_DOMAIN}/openapi-privacy.json` : 'https://api.dangling-dice-studios.com/openapi-privacy.json',
    expectedStatus: 200,
    checkBody: (body) => body.toLowerCase().includes('privacy') && body.toLowerCase().includes('redact'),
  },
  {
    category: '📜 OpenAPI Microservice Specs',
    name: 'Music Theory & MIDI Spec',
    url: isLocal ? `${BASE_DOMAIN}/openapi-music.json` : 'https://api.dangling-dice-studios.com/openapi-music.json',
    expectedStatus: 200,
    checkBody: (body) => body.toLowerCase().includes('music') && body.toLowerCase().includes('scale'),
  },
  {
    category: '📜 OpenAPI Microservice Specs',
    name: 'Schema Transformer Spec',
    url: isLocal ? `${BASE_DOMAIN}/openapi-schema.json` : 'https://api.dangling-dice-studios.com/openapi-schema.json',
    expectedStatus: 200,
    checkBody: (body) => body.toLowerCase().includes('schema') && body.toLowerCase().includes('infer'),
  },
  {
    category: '📜 OpenAPI Microservice Specs',
    name: 'GIS Acreage & Polygon Spec',
    url: isLocal ? `${BASE_DOMAIN}/openapi-geo.json` : 'https://api.dangling-dice-studios.com/openapi-geo.json',
    expectedStatus: 200,
    checkBody: (body) => body.toLowerCase().includes('gis') && body.toLowerCase().includes('acreage'),
  },
  {
    category: '📜 OpenAPI Microservice Specs',
    name: 'Financial Math & Loan Spec',
    url: isLocal ? `${BASE_DOMAIN}/openapi-finance.json` : 'https://api.dangling-dice-studios.com/openapi-finance.json',
    expectedStatus: 200,
    checkBody: (body) => body.toLowerCase().includes('financial') && body.toLowerCase().includes('amortization'),
  },

  // 4. Affiliate Redirect Engine & Amazon Deal
  {
    category: '🛒 Affiliate & Attribution Engine',
    name: 'JBL Tune 680NC Amazon Deal',
    url: `${BASE_DOMAIN}/go/gear-jbl-680nc?src=smoke_cli`,
    expectedStatus: 302,
    checkRedirect: (loc) => loc.includes('amazon') || loc.includes('amzn'),
  },
  {
    category: '🛒 Affiliate & Attribution Engine',
    name: 'Amazon Pro Audio Gear Hub',
    url: `${BASE_DOMAIN}/go/amazon?src=smoke_cli`,
    expectedStatus: 302,
    checkRedirect: (loc) => loc.includes('amazon.com') && loc.includes('danglingdice'),
  },
  {
    category: '🛒 Affiliate & Attribution Engine',
    name: 'Sweetwater Audio Redirect',
    url: `${BASE_DOMAIN}/go/sweetwater?src=smoke_cli`,
    expectedStatus: 302,
    checkRedirect: (loc) => loc.includes('sweetwater.com'),
  },

  // 5. SEO & AI Search Engine Discovery
  {
    category: '🤖 SEO & AI Discovery Files',
    name: 'Robots.txt Standard',
    url: `${BASE_DOMAIN}/robots.txt`,
    expectedStatus: 200,
    checkBody: (body) => body.includes('User-agent') && body.includes('Disallow: /v1/'),
  },
  {
    category: '🤖 SEO & AI Discovery Files',
    name: 'Sitemap XML Index',
    url: `${BASE_DOMAIN}/sitemap.xml`,
    expectedStatus: 200,
    checkBody: (body) => body.includes('<urlset') || body.includes('<sitemapindex'),
  },
  {
    category: '🤖 SEO & AI Discovery Files',
    name: 'llms.txt AI Context File',
    url: `${BASE_DOMAIN}/llms.txt`,
    expectedStatus: 200,
    checkBody: (body) => body.includes('Dangling Dice Studios') && body.includes('RapidAPI'),
  },
  {
    category: '🤖 SEO & AI Discovery Files',
    name: 'Discord Verification Standard',
    url: `${BASE_DOMAIN}/.well-known/discord`,
    expectedStatus: 200,
    checkBody: (body) => body.includes('dh='),
  },

  // 6. Security & Vulnerability Hardening
  {
    category: '🛡️ Security Hardening Checks',
    name: 'Dotfile Attack Probe (.env)',
    url: `${BASE_DOMAIN}/.env`,
    expectedStatus: 404,
  },
  {
    category: '🛡️ Security Hardening Checks',
    name: 'Dotfile Attack Probe (.git)',
    url: `${BASE_DOMAIN}/.git/config`,
    expectedStatus: 404,
  },
  {
    category: '🛡️ Security Hardening Checks',
    name: 'GET on POST compute route (302 redirect)',
    url: `${BASE_DOMAIN}/v1/schema/infer`,
    expectedStatus: 302,
    checkRedirect: (loc) => loc.includes('#computeApiSuite'),
  },
];

async function runSmokescreen() {
  const startTime = Date.now();
  console.log('\n================================================================');
  console.log('💨 DANGLING DICE STUDIOS™ SMOKESCREEN TEST ENGINE');
  console.log(`🎯 Target: ${isLocal ? 'Localhost (Dev Mode)' : 'Production (Live Monorepo)'}`);
  console.log(`⏰ Time:   ${new Date().toISOString()}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  let currentCategory = '';

  for (const t of TARGETS) {
    if (t.category !== currentCategory) {
      currentCategory = t.category;
      console.log(`\n${currentCategory}`);
      console.log('----------------------------------------------------------------');
    }

    const startReq = Date.now();
    try {
      const res = await fetch(t.url, {
        method: 'GET',
        redirect: 'manual', // do not follow redirects so we can assert on 302 Location
        headers: {
          'User-Agent': 'DanglingDice-SmokescreenBot/1.0',
        },
      });

      const latency = Date.now() - startReq;
      const status = res.status;
      let ok = status === t.expectedStatus;
      let errorMsg = '';

      if (ok) {
        if (t.checkRedirect) {
          const loc = res.headers.get('location') || '';
          if (!t.checkRedirect(loc)) {
            ok = false;
            errorMsg = `Location mismatch: ${loc}`;
          }
        } else if (t.checkBody) {
          const body = await res.text();
          if (!t.checkBody(body)) {
            ok = false;
            errorMsg = 'Body validation failed';
          }
        }
      } else {
        errorMsg = `Expected HTTP ${t.expectedStatus}, got ${status}`;
      }

      if (ok) {
        passed++;
        console.log(`  ✅  ${t.name.padEnd(42)} [HTTP ${status}] (${latency}ms)`);
      } else {
        failed++;
        console.log(`  ❌  ${t.name.padEnd(42)} [FAILED] (${latency}ms) -> ${errorMsg}`);
      }
    } catch (err) {
      failed++;
      const latency = Date.now() - startReq;
      console.log(`  ❌  ${t.name.padEnd(42)} [ERROR] (${latency}ms) -> ${err.message}`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n================================================================');
  console.log(`🏁 SMOKESCREEN TEST COMPLETE IN ${duration}s`);
  console.log(`📊 RESULTS: ${passed} Passed, ${failed} Failed out of ${TARGETS.length} Total Checks`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL SYSTEMS OPERATIONAL: 100% PASS RATE\n');
    process.exit(0);
  }
}

runSmokescreen();
