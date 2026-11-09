// ============================================================================
// Dangling Dice Dev Suite™ — System Simulators & Networking Module
// Token Bucket Rate Limiter, CRON Expression Builder, & HTTP / CORS Matrix
// ============================================================================

/**
 * 1. Token Bucket Rate Limiter Simulator State Machine
 */
export class TokenBucketSimulator {
  constructor(capacity = 10, refillRatePerSec = 2) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefill = performance.now();
    this.history = [];
  }

  refill() {
    const now = performance.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    const addedTokens = elapsedSec * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
    this.lastRefill = now;
    return this.tokens;
  }

  sendRequest() {
    this.refill();
    const allowed = this.tokens >= 1;
    let status = 200;
    let message = 'HTTP 200 OK — Request processed successfully.';

    if (allowed) {
      this.tokens -= 1;
    } else {
      status = 429;
      const waitSec = Math.ceil((1 - this.tokens) / this.refillRate);
      message = `HTTP 429 Too Many Requests — Throttled. Retry-After: ${waitSec}s`;
    }

    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      status,
      allowed,
      tokensLeft: Math.floor(this.tokens),
      message,
    };

    this.history.unshift(logEntry);
    if (this.history.length > 8) this.history.pop();

    return logEntry;
  }
}

/**
 * 2. CRON Expression Translator & Next Executions
 */
export function translateCron(cronStr) {
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length < 5) {
    return { valid: false, english: 'Invalid CRON: Requires at least 5 fields (min hour day month weekday).' };
  }

  const [min, hour, day, month, weekday] = parts;

  let desc = 'Runs ';
  if (min === '*' && hour === '*') desc += 'every minute';
  else if (min.startsWith('*/')) desc += `every ${min.replace('*/', '')} minutes`;
  else if (hour === '*' && min !== '*') desc += `at minute ${min} of every hour`;
  else if (hour !== '*' && min !== '*') desc += `at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;

  if (day !== '*') desc += ` on day ${day} of the month`;
  if (month !== '*') desc += ` in month ${month}`;
  if (weekday !== '*') {
    const dayMap = { '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday', '6': 'Saturday', '1-5': 'Monday through Friday' };
    desc += ` on ${dayMap[weekday] || `weekday ${weekday}`}`;
  }

  // Calculate upcoming execution timestamps (approximate 5 next runs)
  const nextRuns = [];
  let runner = new Date();
  runner.setSeconds(0, 0);

  for (let i = 0; i < 5; i++) {
    runner = new Date(runner.getTime() + 60000); // Step forward
    if (min.startsWith('*/')) {
      const step = parseInt(min.replace('*/', ''), 10) || 5;
      while (runner.getMinutes() % step !== 0) {
        runner = new Date(runner.getTime() + 60000);
      }
    }
    nextRuns.push(runner.toLocaleString());
  }

  return {
    valid: true,
    english: desc,
    nextRuns,
  };
}

/**
 * 3. HTTP Status Codes & Essential Headers Catalog
 */
export const HTTP_STATUS_CATALOG = [
  {
    code: 200,
    title: '200 OK',
    type: 'success',
    rule: 'Standard REST response for successful GET, PUT, or PATCH operations returning a resource payload.',
  },
  {
    code: 201,
    title: '201 Created',
    type: 'success',
    rule: 'Returned exclusively by POST requests that successfully land a new record. Should include a Location header.',
  },
  {
    code: 204,
    title: '204 No Content',
    type: 'success',
    rule: 'Used for successful DELETE or batch actions where the client expects no body in the response payload.',
  },
  {
    code: 301,
    title: '301 Moved Permanently',
    type: 'redirect',
    rule: 'Informs crawlers and clients the endpoint URL has permanently relocated. Browsers cache this indefinitely.',
  },
  {
    code: 304,
    title: '304 Not Modified',
    type: 'redirect',
    rule: 'Crucial for caching. When a client provides If-None-Match (ETag), return 304 with 0 bytes body to save bandwidth.',
  },
  {
    code: 400,
    title: '400 Bad Request',
    type: 'client_error',
    rule: 'Syntax error, malformed JSON, or missing mandatory query parameters before reaching business logic.',
  },
  {
    code: 401,
    title: '401 Unauthorized',
    type: 'client_error',
    rule: 'Missing or invalid authentication credentials (e.g. invalid JWT or expired API key). Requires WWW-Authenticate.',
  },
  {
    code: 403,
    title: '403 Forbidden',
    type: 'client_error',
    rule: 'The user is authenticated, but their role/permissions do NOT allow this action (e.g. non-admin deleting items).',
  },
  {
    code: 404,
    title: '404 Not Found',
    type: 'client_error',
    rule: 'The resource ID does not exist in the database, or an unmapped API route was queried.',
  },
  {
    code: 409,
    title: '409 Conflict',
    type: 'client_error',
    rule: 'State collision in the database (e.g. attempting to register an email or slug that already exists).',
  },
  {
    code: 422,
    title: '422 Unprocessable Entity',
    type: 'client_error',
    rule: 'Payload syntax is valid JSON, but fails business validation rules (e.g. negative prices, invalid phone formats).',
  },
  {
    code: 429,
    title: '429 Too Many Requests',
    type: 'client_error',
    rule: 'Rate limit bucket exceeded. Must include Retry-After header indicating when the client may retry.',
  },
  {
    code: 500,
    title: '500 Internal Server Error',
    type: 'server_error',
    rule: 'Unhandled exception in your code. Never expose raw stack traces to the public; log them to telemetry instead.',
  },
  {
    code: 503,
    title: '503 Service Unavailable',
    type: 'server_error',
    rule: 'Temporary overload or scheduled maintenance. Upstream services (e.g. MongoDB Atlas) are unreachable.',
  },
];

export const HTTP_HEADERS_CATALOG = [
  {
    header: 'Access-Control-Allow-Origin: *',
    type: 'cors',
    purpose: 'Allows client web browsers on any domain to read the API response without being blocked by CORS.',
  },
  {
    header: 'Cache-Control: public, max-age=86400',
    type: 'caching',
    purpose: 'Instructs CDNs (Cloudflare) and client browsers to cache static JSON/specs for 24 hours.',
  },
  {
    header: 'ETag: W/"..."',
    type: 'caching',
    purpose: 'Unique hash of the resource state. Enables conditional 304 Not Modified roundtrips.',
  },
  {
    header: 'X-RateLimit-Remaining: 298',
    type: 'telemetry',
    purpose: 'Informs automated API consumers how many tokens remain in their active quota window.',
  },
];
