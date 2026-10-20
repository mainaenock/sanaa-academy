import { describe, expect, it } from 'vitest';
import { defaultCourse } from '../lib/defaults';
import {
  csvCell,
  paymentMatches,
  quote,
  registrationAvailable,
  registrationSchema,
  safeUrl,
} from '../lib/domain';
import { verifyWebhook } from '../lib/crypto';
import { currentWeek } from '../lib/format';
const registration = {
  name: 'A learner',
  learnerEmail: 'learner@example.test',
  phone: '+254712345678',
  ageCategory: 'adult',
  terms: true,
};
describe('registration and pricing', () => {
  it('calculates the current week using the configured local calendar', () => {
    expect(currentWeek(defaultCourse, new Date('2026-11-08T21:00:00Z'))).toBe(1);
    expect(
      currentWeek({ ...defaultCourse, timezone: 'UTC' }, new Date('2026-11-08T21:00:00Z')),
    ).toBe(0);
    expect(currentWeek(defaultCourse, new Date('2026-11-15T21:00:00Z'))).toBe(2);
  });
  it('validates adult data and rejects invalid contact details', () => {
    expect(registrationSchema.safeParse(registration).success).toBe(true);
    expect(registrationSchema.safeParse({ ...registration, learnerEmail: 'invalid' }).success).toBe(
      false,
    );
    expect(registrationSchema.safeParse({ ...registration, terms: false }).success).toBe(false);
  });
  it('requires complete guardian consent for a minor', () => {
    expect(registrationSchema.safeParse({ ...registration, ageCategory: 'minor' }).success).toBe(
      false,
    );
    expect(
      registrationSchema.safeParse({
        ...registration,
        ageCategory: 'minor',
        guardianName: 'Parent Name',
        guardianEmail: 'parent@example.test',
        guardianPhone: '+254700000000',
        guardianConsent: true,
      }).success,
    ).toBe(true);
  });
  it('charges KES in subunits through the Nairobi deadline', () => {
    expect(quote(defaultCourse, new Date('2026-11-01T20:59:59.999Z'))).toMatchObject({
      amount: 800000,
      tier: 'early',
      currency: 'KES',
    });
    expect(quote(defaultCourse, new Date('2026-11-01T21:00:00.000Z'))).toMatchObject({
      amount: 1000000,
      tier: 'regular',
    });
  });
  it('enforces registration settings and opening windows', () => {
    expect(registrationAvailable({ ...defaultCourse, registration_open: 0 })).toBe(false);
    expect(
      registrationAvailable(
        { ...defaultCourse, opens_at: '2026-11-01T00:00:00Z' },
        new Date('2026-10-01'),
      ),
    ).toBe(false);
  });
  it('rejects unsafe resource URLs and CSV formula injection', () => {
    expect(safeUrl.safeParse('javascript:alert(1)').success).toBe(false);
    expect(safeUrl.safeParse('https://user:pass@example.test').success).toBe(false);
    expect(csvCell('=1+1')).toBe('"\'=1+1"');
  });
});
describe('payment authenticity', () => {
  const expected = {
    reference: 'ref',
    amount: 800000,
    currency: 'KES',
    provider_mode: 'test',
    enrollment_id: 'en-1',
  };
  const valid = {
    id: 123,
    reference: 'ref',
    amount: 800000,
    currency: 'KES',
    status: 'success',
    domain: 'test',
    metadata: { enrollment_id: 'en-1' },
  };
  it('requires all stored payment attributes', () => {
    expect(paymentMatches(expected, valid)).toBe(true);
    for (const mismatch of [
      { amount: 8000 },
      { currency: 'NGN' },
      { reference: 'other' },
      { status: 'failed' },
      { domain: 'live' },
      { metadata: { enrollment_id: 'other' } },
    ])
      expect(paymentMatches(expected, { ...valid, ...mismatch })).toBe(false);
  });
  it('checks SHA-512 signature over the exact raw payload', async () => {
    const raw = '{"event":"charge.success"}',
      secret = 'test-only-secret';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign'],
    );
    const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
    const signature = Array.from(new Uint8Array(bytes), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    expect(await verifyWebhook(raw, signature, secret)).toBe(true);
    expect(await verifyWebhook(raw + ' ', signature, secret)).toBe(false);
    expect(await verifyWebhook(raw, 'bad', secret)).toBe(false);
  });
});
