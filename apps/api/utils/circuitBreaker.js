/**
 * ============================================================================
 * Dangling Dice Studios™ — Microservice Circuit Breaker (DevOps / SRE)
 * Prevents cascade failures when external upstream dependencies (Cobalt, RapidAPI, Discord) fail.
 * Fails fast during outages instead of tying up worker threads and connection pools.
 * ============================================================================
 */

export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeoutMs = options.resetTimeoutMs || 30000; // 30s cool-down
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED (healthy), OPEN (failing fast), HALF_OPEN (probing)
  }

  isOpen() {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        console.log(`[CircuitBreaker:${this.name}] Transitioned to HALF_OPEN (probing upstream)`);
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    if (this.state !== 'CLOSED') {
      console.log(`[CircuitBreaker:${this.name}] Upstream healthy. Transitioned to CLOSED`);
    }
    this.state = 'CLOSED';
  }

  recordFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.warn(`[CircuitBreaker:${this.name}] Failure recorded (${this.failureCount}/${this.failureThreshold}):`, error?.message || error);

    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      console.error(`[CircuitBreaker:${this.name}] Failure threshold reached. Circuit OPEN (failing fast for ${this.resetTimeoutMs / 1000}s)`);
    }
  }

  async execute(fn, fallbackFn = null) {
    if (this.isOpen()) {
      console.warn(`[CircuitBreaker:${this.name}] Circuit is OPEN. Fast-failing without upstream request.`);
      if (typeof fallbackFn === 'function') {
        return await fallbackFn(new Error(`Circuit breaker '${this.name}' is OPEN`));
      }
      throw new Error(`Circuit breaker '${this.name}' is OPEN. Upstream temporarily unavailable.`);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure(err);
      if (typeof fallbackFn === 'function') {
        return await fallbackFn(err);
      }
      throw err;
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      healthy: this.state === 'CLOSED',
    };
  }
}

export const rapidApiBreaker = new CircuitBreaker('RapidAPI_Media', { failureThreshold: 3, resetTimeoutMs: 30000 });
export const cobaltBreaker = new CircuitBreaker('Cobalt_Media', { failureThreshold: 3, resetTimeoutMs: 30000 });
export const discordBreaker = new CircuitBreaker('Discord_Webhook', { failureThreshold: 3, resetTimeoutMs: 20000 });
