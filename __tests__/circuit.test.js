import assert from 'node:assert';
import test from 'node:test';
import { CircuitBreaker } from '../dist/circuit-breaker.js';

test('CircuitBreaker transitions from CLOSED to OPEN after failure threshold', async () => {
  const cb = new CircuitBreaker({ failureThreshold: 2, recoveryTimeoutMs: 50, halfOpenMaxCalls: 1 });
  assert.strictEqual(cb.getState(), 'CLOSED');

  await assert.rejects(() => cb.execute(async () => { throw new Error('fail'); }));
  await assert.rejects(() => cb.execute(async () => { throw new Error('fail'); }));

  assert.strictEqual(cb.getState(), 'OPEN');
  await assert.rejects(() => cb.execute(async () => 'ok'), /CircuitBreaker is OPEN/);
});
