import { pbkdf2Sync } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { passwordHash, passwordMatches } from '../lib/auth';

afterEach(() => vi.restoreAllMocks());

describe('password hashing under production Workers limits', () => {
  it('matches existing Node-generated hashes and verifies passwords under the native cap', async () => {
    const password = 'existing-admin-password-123';
    const salt = new Uint8Array(16).fill(7);
    const expected = `pbkdf2$210000$${Buffer.from(salt).toString('hex')}$${pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex')}`;
    expect(await passwordHash(password, salt)).toBe(expected);
    expect(await passwordMatches(password, expected)).toBe(true);
    expect(await passwordMatches('incorrect-password', expected)).toBe(false);
  }, 90_000);

  it('propagates unrelated crypto failures', async () => {
    vi.spyOn(crypto.subtle, 'deriveBits').mockRejectedValue(new Error('Unexpected crypto failure'));
    await expect(passwordHash('test-password-123')).rejects.toThrow('Unexpected crypto failure');
  });
});
