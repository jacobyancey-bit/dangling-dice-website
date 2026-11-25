import test from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker } from '../utils/circuitBreaker.js';

test('🏗️ Reliability, Architecture & SRE Suite', async (t) => {
  await t.test('REL-01: Circuit Breaker starts CLOSED and records successful calls', async () => {
    const breaker = new CircuitBreaker('TestBreaker_Success', { failureThreshold: 2, resetTimeoutMs: 50 });
    assert.strictEqual(breaker.state, 'CLOSED');
    assert.strictEqual(breaker.isOpen(), false);

    const result = await breaker.execute(async () => 'OK_SUCCESS');
    assert.strictEqual(result, 'OK_SUCCESS');
    assert.strictEqual(breaker.failureCount, 0);
  });

  await t.test('REL-02: Circuit Breaker trips to OPEN after failure threshold and fails fast', async () => {
    const breaker = new CircuitBreaker('TestBreaker_Fail', { failureThreshold: 2, resetTimeoutMs: 100 });

    // Failure 1
    await assert.rejects(
      async () => breaker.execute(async () => { throw new Error('First upstream timeout'); }),
      { message: 'First upstream timeout' }
    );
    assert.strictEqual(breaker.state, 'CLOSED');
    assert.strictEqual(breaker.failureCount, 1);

    // Failure 2 (trips threshold)
    await assert.rejects(
      async () => breaker.execute(async () => { throw new Error('Second upstream timeout'); }),
      { message: 'Second upstream timeout' }
    );
    assert.strictEqual(breaker.state, 'OPEN');
    assert.strictEqual(breaker.isOpen(), true);

    // Fast-fail verification (does NOT execute function, rejects instantly)
    let functionExecuted = false;
    await assert.rejects(
      async () => breaker.execute(async () => { functionExecuted = true; return 'SHOULD_NOT_RUN'; }),
      /Circuit breaker.*is OPEN/
    );
    assert.strictEqual(functionExecuted, false, 'Should not execute function when circuit is OPEN');
  });

  await t.test('REL-03: Circuit Breaker half-opens after timeout and recovers upon successful probe', async () => {
    const breaker = new CircuitBreaker('TestBreaker_Recover', { failureThreshold: 1, resetTimeoutMs: 50 });

    await assert.rejects(
      async () => breaker.execute(async () => { throw new Error('Network error'); }),
      { message: 'Network error' }
    );
    assert.strictEqual(breaker.state, 'OPEN');

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Next call should probe upstream and recover to CLOSED
    const recovered = await breaker.execute(async () => 'RECOVERED_VALUE');
    assert.strictEqual(recovered, 'RECOVERED_VALUE');
    assert.strictEqual(breaker.state, 'CLOSED');
    assert.strictEqual(breaker.failureCount, 0);
  });

  await t.test('REL-04: Circuit Breaker execute with fallback returns fallback gracefully', async () => {
    const breaker = new CircuitBreaker('TestBreaker_Fallback', { failureThreshold: 1, resetTimeoutMs: 1000 });

    // Execute with fallback handler
    const result = await breaker.execute(
      async () => { throw new Error('Critical failure'); },
      (err) => ({ fallback: true, error: err.message })
    );

    assert.deepStrictEqual(result, { fallback: true, error: 'Critical failure' });
    assert.strictEqual(breaker.state, 'OPEN');
  });

  await t.test('REL-05: Circuit Breaker telemetry status reports accurate metrics', () => {
    const breaker = new CircuitBreaker('Telemetry_Check');
    const status = breaker.getStatus();
    assert.strictEqual(status.name, 'Telemetry_Check');
    assert.strictEqual(status.state, 'CLOSED');
    assert.strictEqual(status.healthy, true);
    assert.strictEqual(status.failureCount, 0);
  });
});
