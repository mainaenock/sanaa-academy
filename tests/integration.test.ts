import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { handleApi } from '../lib/api';
import { digest, randomToken } from '../lib/crypto';
import { first, statement, type AppEnv } from '../lib/db';
import { settle } from '../lib/payments';
import { quote } from '../lib/domain';
import { defaultCourse } from '../lib/defaults';
import { deliverEmail, queueEmail } from '../lib/email';
const e: AppEnv = env;
async function account(role = 'student') {
  const id = crypto.randomUUID(),
    email = id + '@example.test',
    token = randomToken(),
    csrf = randomToken();
  await statement(
    e,
    'INSERT INTO users(id,email,name,phone,role,verified_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)',
    id,
    email,
    'Test learner',
    '+254700000001',
    role,
  ).run();
  await statement(
    e,
    'INSERT INTO auth_sessions(token_hash,user_id,csrf_token,expires_at) VALUES(?,?,?,?)',
    await digest(token),
    id,
    csrf,
    Math.floor(Date.now() / 1000) + 3600,
  ).run();
  return { id, email, csrf, cookie: 'sanaa_session=' + token };
}
type Account = Awaited<ReturnType<typeof account>>;
async function enrollment(user: Account, status = 'pending') {
  const id = crypto.randomUUID();
  await statement(
    e,
    'INSERT INTO enrollments(id,user_id,course_id,status,terms_version) VALUES(?,?,?,?,?)',
    id,
    user.id,
    'ai-web-2026',
    status,
    'test',
  ).run();
  return id;
}
async function transaction(enrollmentId: string) {
  const reference = 'sanaa-' + crypto.randomUUID();
  await statement(
    e,
    'INSERT INTO transactions(id,reference,enrollment_id,payer_email,amount,pricing_tier,provider_mode) VALUES(?,?,?,?,?,?,?)',
    crypto.randomUUID(),
    reference,
    enrollmentId,
    'payer@example.test',
    800000,
    'early',
    'test',
  ).run();
  return {
    id: crypto.randomUUID(),
    reference,
    amount: 800000,
    currency: 'KES',
    status: 'success',
    domain: 'test',
    metadata: { enrollment_id: enrollmentId },
  };
}
function request(path: string, body?: unknown, user?: Account, method?: string) {
  return new Request('http://localhost:5173/api/' + path, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: {
      Origin: 'http://localhost:5173',
      'Content-Type': 'application/json',
      ...(user ? { Cookie: user.cookie, 'x-csrf-token': user.csrf } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
beforeEach(async () => {
  await statement(e, 'DELETE FROM rate_limits').run();
});
afterEach(() => vi.restoreAllMocks());
describe('real D1 settlement', () => {
  it('suppresses already-queued announcements after a learner opts out', async () => {
    const user = await account();
    await enrollment(user, 'active');
    const id = crypto.randomUUID();
    await queueEmail(e, {
      id,
      key: id,
      userId: user.id,
      to: user.email,
      subject: 'Course update',
      html: 'A course update',
      kind: 'announcement',
    });
    const network = vi.spyOn(globalThis, 'fetch');
    expect(
      await deliverEmail({ ...e, RESEND_API_KEY: 'test', EMAIL_FROM: 'academy@example.test' }, id),
    ).toBe(false);
    expect(network).not.toHaveBeenCalled();
    expect(
      (await first<{ last_error: string }>(e, 'SELECT last_error FROM email_outbox WHERE id=?', id))
        ?.last_error,
    ).toContain('Suppressed');
  });
  it('activates enrollment once and deduplicates welcome outbox entries', async () => {
    const user = await account(),
      id = await enrollment(user),
      payment = await transaction(id);
    await settle(e, payment);
    await settle(e, payment);
    expect(
      (await first<{ status: string }>(e, 'SELECT status FROM enrollments WHERE id=?', id))?.status,
    ).toBe('active');
    expect(
      (
        await first<{ count: number }>(
          e,
          "SELECT COUNT(*) count FROM email_outbox WHERE user_id=? AND kind='welcome'",
          user.id,
        )
      )?.count,
    ).toBe(1);
  });
  it('rejects amount mismatch without granting access', async () => {
    const user = await account(),
      id = await enrollment(user),
      payment = await transaction(id);
    await expect(settle(e, { ...payment, amount: 1 })).rejects.toThrow();
    expect(
      (await first<{ status: string }>(e, 'SELECT status FROM enrollments WHERE id=?', id))?.status,
    ).toBe('pending');
  });
  it('revokes access on a confirmed refund and cannot be reactivated by stale success', async () => {
    const user = await account(),
      id = await enrollment(user),
      payment = await transaction(id);
    await settle(e, payment);
    await statement(
      e,
      "UPDATE transactions SET status='refunded' WHERE reference=?",
      payment.reference,
    ).run();
    await settle(e, payment);
    expect(
      (await first<{ status: string }>(e, 'SELECT status FROM enrollments WHERE id=?', id))?.status,
    ).toBe('refunded');
  });
  it('preserves active enrollment if email delivery fails', async () => {
    const user = await account(),
      id = await enrollment(user),
      payment = await transaction(id);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 503 }));
    await settle({ ...e, RESEND_API_KEY: 'test', EMAIL_FROM: 'academy@example.test' }, payment);
    expect(
      (await first<{ status: string }>(e, 'SELECT status FROM enrollments WHERE id=?', id))?.status,
    ).toBe('active');
    expect(
      (
        await first<{ status: string }>(
          e,
          'SELECT status FROM email_outbox WHERE id=?',
          'welcome-' + id,
        )
      )?.status,
    ).toBe('failed');
  });
});
describe('authorization and learning actions', () => {
  it('rejects anonymous and non-admin access', async () => {
    expect((await handleApi(request('admin/students'), e)).status).toBe(401);
    const user = await account();
    expect((await handleApi(request('admin/students', undefined, user), e)).status).toBe(403);
    expect((await handleApi(request('student', undefined, user), e)).status).toBe(403);
  });
  it('rejects cross-origin and missing CSRF mutations', async () => {
    const user = await account();
    await enrollment(user, 'active');
    const req = request('student/progress', { lessonId: 'lesson-1-1', completed: true }, user);
    req.headers.delete('x-csrf-token');
    expect((await handleApi(req, e)).status).toBe(403);
    const cross = request('student/progress', { lessonId: 'lesson-1-1', completed: true }, user);
    cross.headers.set('origin', 'https://attacker.test');
    expect((await handleApi(cross, e)).status).toBe(403);
  });
  it('records progress only for the current learner and removes it', async () => {
    const user = await account(),
      other = await account();
    await enrollment(user, 'active');
    await enrollment(other, 'active');
    expect(
      (
        await handleApi(
          request(
            'student/progress',
            { lessonId: 'lesson-1-1', completed: true, userId: other.id },
            user,
          ),
          e,
        )
      ).status,
    ).toBe(200);
    expect(
      await first(e, 'SELECT user_id FROM lesson_progress WHERE user_id=?', other.id),
    ).toBeNull();
    expect(
      await first(e, 'SELECT user_id FROM lesson_progress WHERE user_id=?', user.id),
    ).not.toBeNull();
    await handleApi(
      request('student/progress', { lessonId: 'lesson-1-1', completed: false }, user),
      e,
    );
    expect(
      await first(e, 'SELECT user_id FROM lesson_progress WHERE user_id=?', user.id),
    ).toBeNull();
  });
  it('supports module CRUD and audits each mutation', async () => {
    const admin = await account('admin');
    const response = await handleApi(
      request(
        'admin/modules',
        {
          data: {
            week_id: 'week-1',
            title: 'A new module',
            description: 'A practical module',
            position: 10,
          },
        },
        admin,
      ),
      e,
    );
    expect(response.status).toBe(200);
    const { id } = (await response.json()) as { id: string };
    expect(
      (
        await handleApi(
          request(
            'admin/modules',
            {
              id,
              data: {
                week_id: 'week-1',
                title: 'Updated module',
                description: 'Updated',
                position: 11,
              },
            },
            admin,
          ),
          e,
        )
      ).status,
    ).toBe(200);
    expect(
      (await first<{ title: string }>(e, 'SELECT title FROM modules WHERE id=?', id))?.title,
    ).toBe('Updated module');
    expect(
      (await handleApi(request('admin/modules?id=' + id, undefined, admin, 'DELETE'), e)).status,
    ).toBe(200);
    expect(await first(e, 'SELECT id FROM modules WHERE id=?', id)).toBeNull();
    expect(
      (
        await first<{ count: number }>(
          e,
          'SELECT COUNT(*) count FROM admin_audit_logs WHERE entity_id=?',
          id,
        )
      )?.count,
    ).toBe(3);
  });
  it('does not expose another learner’s payment', async () => {
    const owner = await account(),
      other = await account(),
      id = await enrollment(owner),
      payment = await transaction(id);
    expect(
      (await handleApi(request('payments/verify', { reference: payment.reference }, other), e))
        .status,
    ).toBe(404);
  });
  it('validates project submissions and keeps them scoped to the learner', async () => {
    const user = await account();
    await enrollment(user, 'active');
    const response = await handleApi(
      request(
        'student/submissions',
        {
          assignmentId: 'assignment-1-1',
          description: 'A project that helps a local community share resources.',
          githubUrl: 'https://github.com/example/project',
          websiteUrl: 'https://example.test',
        },
        user,
      ),
      e,
    );
    expect(response.status).toBe(200);
    expect(
      (
        await first<{ user_id: string }>(
          e,
          'SELECT user_id FROM submissions WHERE user_id=?',
          user.id,
        )
      )?.user_id,
    ).toBe(user.id);
  });
});
describe('signed webhook delivery', () => {
  it('associates a verified refund by the provider transaction ID', async () => {
    const user = await account(),
      id = await enrollment(user),
      payment = await transaction(id),
      secret = 'sk_test_example';
    payment.id = String(crypto.getRandomValues(new Uint32Array(1))[0]);
    await settle(e, payment);
    const refundId = 12345,
      raw = JSON.stringify({ event: 'refund.processed', data: { id: refundId } });
    const signingKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign'],
    );
    const signature = Array.from(
      new Uint8Array(await crypto.subtle.sign('HMAC', signingKey, new TextEncoder().encode(raw))),
      (b) => b.toString(16).padStart(2, '0'),
    ).join('');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        status: true,
        data: {
          id: refundId,
          domain: 'test',
          status: 'processed',
          amount: payment.amount,
          currency: 'KES',
          transaction: Number(payment.id),
        },
      }),
    );
    const response = await handleApi(
      new Request('http://localhost:5173/api/webhooks/paystack', {
        method: 'POST',
        headers: { 'x-paystack-signature': signature },
        body: raw,
      }),
      { ...e, PAYSTACK_SECRET_KEY: secret },
    );
    expect(response.status).toBe(200);
    expect(
      (await first<{ status: string }>(e, 'SELECT status FROM enrollments WHERE id=?', id))?.status,
    ).toBe('refunded');
  });
  it('rejects an invalid signature without changes', async () => {
    const req = new Request('http://localhost:5173/api/webhooks/paystack', {
      method: 'POST',
      headers: { 'x-paystack-signature': 'bad' },
      body: '{}',
    });
    expect((await handleApi(req, { ...e, PAYSTACK_SECRET_KEY: 'sk_test_example' })).status).toBe(
      401,
    );
  });
  it('verifies with the provider and handles duplicate webhook delivery', async () => {
    const user = await account(),
      id = await enrollment(user),
      payment = await transaction(id),
      secret = 'sk_test_example',
      raw = JSON.stringify({ event: 'charge.success', data: { reference: payment.reference } });
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign'],
    );
    const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
    const signature = Array.from(new Uint8Array(signed), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ status: true, data: payment }));
    const send = () =>
      handleApi(
        new Request('http://localhost:5173/api/webhooks/paystack', {
          method: 'POST',
          headers: { 'x-paystack-signature': signature },
          body: raw,
        }),
        { ...e, PAYSTACK_SECRET_KEY: secret },
      );
    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(
      (
        await first<{ count: number }>(
          e,
          "SELECT COUNT(*) count FROM email_outbox WHERE user_id=? AND kind='welcome'",
          user.id,
        )
      )?.count,
    ).toBe(1);
  });
});
describe('authentication and complete enrollment flow', () => {
  it('consumes a passwordless code once and creates an HttpOnly session', async () => {
    const email = crypto.randomUUID() + '@example.test',
      code = '72519384';
    await statement(
      e,
      "INSERT INTO auth_tokens(token_hash,email,purpose,expires_at) VALUES(?,?,'login',?)",
      await digest(email + ':' + code),
      email,
      Math.floor(Date.now() / 1000) + 600,
    ).run();
    const result = await handleApi(request('auth/verify', { email, code }), e);
    expect(result.status).toBe(200);
    expect(result.headers.get('set-cookie')).toContain('HttpOnly');
    expect((await handleApi(request('auth/verify', { email, code }), e)).status).toBe(400);
  });
  it('initializes a server-priced checkout, confirms payment and grants private lessons', async () => {
    const user = await account(),
      amount = quote(defaultCourse).amount;
    const configured = {
      ...e,
      PAYSTACK_SECRET_KEY: 'sk_test_example',
      RESEND_API_KEY: 'test-only',
      EMAIL_FROM: 'academy@example.test',
      TURNSTILE_SITE_KEY: 'test-only',
      TURNSTILE_SECRET_KEY: 'test-only',
    };
    let reference = '',
      enrollmentId = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes('siteverify'))
        return Response.json({ success: true, hostname: 'localhost', action: 'register' });
      if (url.endsWith('/transaction/initialize')) {
        const body = JSON.parse(String(init?.body));
        reference = body.reference;
        enrollmentId = JSON.parse(body.metadata).enrollment_id;
        expect(body.amount).toBe(String(amount));
        expect(body.currency).toBe('KES');
        expect(body.channels).toContain('mobile_money');
        return Response.json({
          status: true,
          data: { reference, authorization_url: 'https://checkout.paystack.com/test-checkout' },
        });
      }
      if (url.includes('/transaction/verify/'))
        return Response.json({
          status: true,
          data: {
            id: crypto.randomUUID(),
            reference,
            amount,
            currency: 'KES',
            status: 'success',
            domain: 'test',
            metadata: JSON.stringify({ enrollment_id: enrollmentId }),
          },
        });
      if (url === 'https://api.resend.com/emails') return Response.json({ id: 'test-email' });
      throw new Error('Unexpected provider request');
    });
    const form = {
      name: 'New learner',
      learnerEmail: user.email,
      phone: '+254700000000',
      ageCategory: 'adult',
      terms: true,
      turnstileToken: 'test-token',
      expectedAmount: amount,
    };
    const initialized = await handleApi(request('enroll', form, user), configured);
    expect(initialized.status).toBe(200);
    expect((await handleApi(request('student', undefined, user), configured)).status).toBe(403);
    expect(
      (await handleApi(request('payments/verify', { reference }, user), configured)).status,
    ).toBe(200);
    const classroom = await handleApi(request('student', undefined, user), configured);
    expect(classroom.status).toBe(200);
    expect(((await classroom.json()) as { lessons: unknown[] }).lessons.length).toBe(12);
    expect((await handleApi(request('enroll', form, user), configured)).status).toBe(409);
  });
  it('never accepts a client-supplied discounted amount', async () => {
    const user = await account();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ success: true, hostname: 'localhost', action: 'register' }),
    );
    const configured = {
      ...e,
      PAYSTACK_SECRET_KEY: 'sk_test_example',
      RESEND_API_KEY: 'test',
      EMAIL_FROM: 'academy@example.test',
      TURNSTILE_SITE_KEY: 'test',
      TURNSTILE_SECRET_KEY: 'test',
    };
    expect(
      (
        await handleApi(
          request(
            'enroll',
            {
              name: 'Learner Name',
              learnerEmail: user.email,
              phone: '+254700000000',
              ageCategory: 'adult',
              terms: true,
              turnstileToken: 'test',
              expectedAmount: 1,
            },
            user,
          ),
          configured,
        )
      ).status,
    ).toBe(409);
  });
  it('keeps a failed payment pending for enrollment access', async () => {
    const user = await account(),
      id = await enrollment(user),
      payment = await transaction(id);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ status: true, data: { ...payment, status: 'failed' } }),
    );
    const result = await handleApi(
      request('payments/verify', { reference: payment.reference }, user),
      { ...e, PAYSTACK_SECRET_KEY: 'sk_test_example' },
    );
    expect(result.status).toBe(200);
    expect(
      (await first<{ status: string }>(e, 'SELECT status FROM enrollments WHERE id=?', id))?.status,
    ).toBe('pending');
    expect((await handleApi(request('student', undefined, user), e)).status).toBe(403);
  });
  it('fails closed on an unexpected bot action', async () => {
    const user = await account();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ success: true, hostname: 'localhost', action: 'wrong' }),
    );
    const result = await handleApi(
      request('auth/request', { email: user.email, turnstileToken: 'test' }),
      { ...e, TURNSTILE_SECRET_KEY: 'test' },
    );
    expect(result.status).toBe(403);
  });
});
