/**
 * ============================================================================
 * Dangling Dice Studios™ — SRE Alert & Observability Engine
 * Dispatches rate-limited Discord embed alerts for 500 errors & critical events.
 * ============================================================================
 */

import { discordBreaker } from './circuitBreaker.js';

// In-memory rate-limiter: alertSignature -> timestamp
const recentAlerts = new Map();
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cool-down per unique error

export async function sendErrorAlert({ error, req = {}, context = '' }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || process.env.NODE_ENV === 'test') {
    return false;
  }

  // De-duplicate errors to prevent webhook spam
  const signature = `${req.method || 'EVENT'}:${req.originalUrl || req.path || context}:${error?.message || 'Unknown'}`;
  const now = Date.now();
  const lastAlertTime = recentAlerts.get(signature);

  if (lastAlertTime && now - lastAlertTime < ALERT_COOLDOWN_MS) {
    return false; // Suppress duplicate alert within cool-down window
  }

  recentAlerts.set(signature, now);

  // Clean up old signatures
  if (recentAlerts.size > 100) {
    for (const [key, timestamp] of recentAlerts.entries()) {
      if (now - timestamp > ALERT_COOLDOWN_MS) {
        recentAlerts.delete(key);
      }
    }
  }

  const requestId = req.id || req.headers?.['x-request-id'] || 'N/A';
  const cleanStack = (error?.stack || '')
    .split('\n')
    .slice(0, 5)
    .join('\n')
    .substring(0, 600);

  const discordPayload = {
    username: 'Dangling Dice SRE Sentinel',
    avatar_url: 'https://dangling-dice-studios.com/images/logo.png',
    embeds: [
      {
        title: `🚨 Server Exception: ${error?.name || 'Internal Error'}`,
        description: `An unhandled exception occurred in production.`,
        color: 0xef4444, // Red
        fields: [
          {
            name: 'Endpoint',
            value: `\`${req.method || 'GET'} ${req.originalUrl || req.url || 'Internal'}\``,
            inline: true,
          },
          {
            name: 'Request ID',
            value: `\`${requestId}\``,
            inline: true,
          },
          {
            name: 'Status Code',
            value: `\`500\``,
            inline: true,
          },
          {
            name: 'Error Message',
            value: `\`\`\`${error?.message || 'Unknown error'}\`\`\``,
            inline: false,
          },
          ...(cleanStack
            ? [
                {
                  name: 'Stack Trace',
                  value: `\`\`\`js\n${cleanStack}\n\`\`\``,
                  inline: false,
                },
              ]
            : []),
        ],
        footer: {
          text: 'Dangling Dice Studios™ • Observability & Automated SRE',
          icon_url: 'https://dangling-dice-studios.com/images/logo.png',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    return await discordBreaker.execute(async () => {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
        signal: AbortSignal.timeout(6000),
      });
      // Non-2xx (429 rate limit, 5xx, deleted webhook) must count as a breaker failure
      if (!response.ok) {
        throw new Error(`Discord webhook HTTP ${response.status}`);
      }
      return true;
    });
  } catch (err) {
    console.warn('[AlertManager] Failed to dispatch Discord alert:', err.message);
    return false;
  }
}
