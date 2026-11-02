import { applyD1Migrations, env } from 'cloudflare:test';
import { beforeEach, vi } from 'vitest';
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// Local workerd does not enforce the production Workers PBKDF2 ceiling.
const deriveBits = crypto.subtle.deriveBits.bind(crypto.subtle);
beforeEach(() => {
  vi.spyOn(crypto.subtle, 'deriveBits').mockImplementation((algorithm, key, length) => {
    if (
      typeof algorithm === 'object' &&
      algorithm.name === 'PBKDF2' &&
      (algorithm as Pbkdf2Params).iterations > 100_000
    )
      return Promise.reject(
        new DOMException('PBKDF2 iteration limit exceeded', 'NotSupportedError'),
      );
    return deriveBits(algorithm, key, length);
  });
});
