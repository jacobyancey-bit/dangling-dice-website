/**
 * ============================================================================
 * Dangling Dice Studios™ — Cloudflare Turnstile Bot Shield Middleware
 * Free, privacy-preserving, puzzle-free CAPTCHA alternative.
 * ============================================================================
 */

const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DUMMY_SECRET = '1x0000000000000000000000000000000AA';

/**
 * Validates a Cloudflare Turnstile client token
 * @param {string} token - The response token from the client widget
 * @param {string} remoteIp - Optional remote client IP address
 */
export async function verifyTurnstileToken(token, remoteIp = null) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY || DUMMY_SECRET;

  // In test mode or when using official dummy pass token, pass immediately
  if (process.env.NODE_ENV === 'test' || token === 'XXXX.DUMMY.TOKEN.XXXX') {
    return { success: true, dummy: true };
  }

  if (!token) {
    return { success: false, error: 'Turnstile verification token missing' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) formData.append('remoteip', remoteIp);

    const res = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(4000),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('⚠️ [Turnstile] Verification timeout or network failure, failing open for UX:', err.message);
    return { success: true, bypassed: true };
  }
}

/**
 * Express middleware to guard critical endpoints against automated bots
 */
export const requireTurnstile = async (req, res, next) => {
  // If not in production or Turnstile is explicitly disabled, bypass
  if (process.env.NODE_ENV === 'test' || !process.env.TURNSTILE_SECRET_KEY) {
    return next();
  }

  const token =
    req.body?.['cf-turnstile-response'] ||
    req.headers['cf-turnstile-response'] ||
    req.headers['x-turnstile-token'];

  const ip = req.headers['cf-connecting-ip'] || req.ip;
  const result = await verifyTurnstileToken(token, ip);

  if (!result.success) {
    return res.status(403).json({
      success: false,
      message: 'Cloudflare Turnstile bot verification failed. Please refresh and try again.',
      errorCodes: result['error-codes'] || ['invalid_token'],
    });
  }

  next();
};
