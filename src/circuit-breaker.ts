import { CircuitState, CircuitOptions } from './types.js';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenCalls = 0;

  constructor(private options: CircuitOptions = { failureThreshold: 5, recoveryTimeoutMs: 10000, halfOpenMaxCalls: 3 }) {}

  getState(): CircuitState {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenCalls = 0;
      }
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();
    if (currentState === 'OPEN') {
      throw new Error('CircuitBreaker is OPEN: request rejected to protect downstream');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
      if (this.halfOpenCalls >= this.options.halfOpenMaxCalls) {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.options.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    }
  }
}
