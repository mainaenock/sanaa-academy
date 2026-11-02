import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../components/client-api';

afterEach(() => vi.restoreAllMocks());

describe('browser API error handling', () => {
  it('shows a helpful message when the platform returns an HTML service error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<!DOCTYPE html><title>Service unavailable</title>', {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      }),
    );
    await expect(api('auth/login', {})).rejects.toThrow(
      'The service is temporarily unavailable. Please try again shortly.',
    );
  });

  it('preserves actionable errors returned by the application', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ error: 'Email or password is incorrect.' }, { status: 401 }),
    );
    await expect(api('auth/login', {})).rejects.toThrow('Email or password is incorrect.');
  });

  it('reports malformed successful responses without leaking parser errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<!DOCTYPE html>'));
    await expect(api('me')).rejects.toThrow(
      'The server returned an unexpected response. Please refresh and try again.',
    );
  });
});
