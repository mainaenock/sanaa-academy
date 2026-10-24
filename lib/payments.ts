import { z } from 'zod';
import { all, course, first, providersReady, statement, type AppEnv } from './db';
import { passwordHash, passwordMatches, sessionFromCookie, type User } from './auth';
import { assert, botCheck, HttpError, rateLimit } from './http';
import {
  COURSE_ID,
  emailSchema,
  POLICY_VERSION,
  paymentMatches,
  quote,
  registrationAvailable,
  registrationSchema,
  type VerifiedPayment,
} from './domain';
import { digest, verifyWebhook } from './crypto';
import { deliverEmail } from './email';
interface Transaction {
  id: string;
  reference: string;
  enrollment_id: string;
  payer_email: string;
  amount: number;
  currency: string;
  status: string;
  provider_mode: string;
  checkout_url: string | null;
  created_at: string;
}
const verifiedSchema = z.object({
  id: z.union([z.number(), z.string()]),
  reference: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  status: z.string(),
  domain: z.string(),
  channel: z.string().optional(),
  paid_at: z.string().nullable().optional(),
  metadata: z.preprocess(
    (value) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return undefined;
        }
      }
      return value;
    },
    z.object({ enrollment_id: z.string().optional() }).nullish(),
  ),
});
function paystackKey(e: AppEnv) {
  assert(e.PAYSTACK_SECRET_KEY, 503, 'Payment service is awaiting configuration.');
  assert(
    e.PAYSTACK_SECRET_KEY.startsWith(e.PAYSTACK_MODE === 'live' ? 'sk_live_' : 'sk_test_'),
    503,
    'Payment mode and key do not match.',
  );
  assert(
    e.APP_ENV !== 'production' || e.PAYSTACK_MODE === 'live',
    503,
    'Production checkout requires live payment configuration.',
  );
  return e.PAYSTACK_SECRET_KEY;
}
async function paystack(e: AppEnv, path: string, body?: unknown) {
  const response = await fetch('https://api.paystack.co' + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + paystackKey(e), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(12000),
  });
  if (response.status >= 400 && response.status < 500)
    throw new HttpError(
      response.status === 404 ? 404 : 400,
      'Payment provider did not accept this request. Your saved reference can be reconciled before retrying.',
    );
  assert(response.ok, 502, 'Payment provider unavailable. Your enrollment is saved; retry later.');
  const result = z.object({ status: z.boolean(), data: z.unknown() }).parse(await response.json());
  assert(result.status, 502, 'Payment request was not accepted.');
  return result.data;
}
export async function enroll(request: Request, e: AppEnv, input: unknown) {
  const session = await sessionFromCookie(e, request.headers.get('cookie'));
  const data = registrationSchema.parse(input);
  const raw = z
    .object({
      turnstileToken: z.string(),
      expectedAmount: z.number().int(),
      accountEmail: z.string().optional(),
      password: z.string().min(10).max(128).optional(),
    })
    .parse(input);
  assert(providersReady(e), 503, 'Checkout is awaiting configuration.');
  await rateLimit(
    e,
    'register:' + (session?.user.id ?? request.headers.get('cf-connecting-ip') ?? 'unknown'),
    8,
  );
  await botCheck(request, e, raw.turnstileToken, 'register');
  let user: User | null | undefined = session?.user;
  if (!user) {
    const account = z
      .object({ email: emailSchema, password: z.string().min(10).max(128) })
      .parse({ email: raw.accountEmail, password: raw.password });
    const matchesEmail = data.ageCategory === 'minor'
      ? data.guardianEmail === account.email
      : data.learnerEmail === account.email;
    assert(
      matchesEmail,
      400,
      data.ageCategory === 'minor'
        ? 'The guardian email must match the account email.'
        : 'Use the account email as the learner email.',
    );
    const existingUser = await first<User & { password_hash: string | null }>(
      e,
      'SELECT * FROM users WHERE email=?',
      account.email,
    );
    if (existingUser) {
      assert(!existingUser.password_hash, 409, 'An account already exists for this email. Sign in to continue.');
      const savedSecret = await first<{ password_hash: string }>(
        e,
        'SELECT password_hash FROM registration_secrets WHERE user_id=?',
        existingUser.id,
      );
      assert(
        savedSecret && (await passwordMatches(account.password, savedSecret.password_hash)),
        409,
        'A registration is already in progress for this email. Use the password you first entered.',
      );
      user = existingUser;
    } else {
      const id = crypto.randomUUID();
      await e.DB.batch([
        statement(
          e,
          'INSERT INTO users(id,email,name,phone,age_category,experience,project_interest,updates_opt_in) VALUES(?,?,?,?,?,?,?,?)',
          id,
          account.email,
          data.name,
          data.phone,
          data.ageCategory,
          data.experience,
          data.projectInterest,
          Number(data.updatesOptIn),
        ),
        statement(
          e,
          'INSERT INTO registration_secrets(user_id,password_hash) VALUES(?,?)',
          id,
          await passwordHash(account.password),
        ),
      ]);
      user = await first<User>(e, 'SELECT * FROM users WHERE id=?', id);
      assert(user, 500, 'Unable to prepare registration.');
    }
  }
  assert(user, 401, 'Please sign in to continue.');
  const c = await course(e);
  assert(registrationAvailable(c), 409, 'Registration is currently closed.');
  const price = quote(c);
  assert(
    raw.expectedAmount === price.amount,
    409,
    'The program price has changed. Refresh this page to review the current amount.',
  );
  assert(
    data.ageCategory === 'minor'
      ? data.guardianEmail === user.email
      : data.learnerEmail === user.email,
    400,
    data.ageCategory === 'minor'
      ? 'The guardian account email must match the account used to register.'
      : 'Use your account email as the learner email.',
  );
  const existing = await first<{ id: string; status: string }>(
    e,
    'SELECT id,status FROM enrollments WHERE user_id=? AND course_id=?',
    user.id,
    COURSE_ID,
  );
  assert(
    !existing || existing.status === 'pending',
    409,
    existing?.status === 'active'
      ? 'You are already enrolled. Open your student portal.'
      : 'Please contact the academy about your previous enrollment.',
  );
  const id = existing?.id ?? crypto.randomUUID();
  // Capacity and insert are evaluated inside D1, including concurrent registrations.
  const insert = statement(
    e,
    `INSERT OR IGNORE INTO enrollments(id,user_id,course_id,terms_version) SELECT ?,?,?,? WHERE (SELECT capacity FROM courses WHERE id=?) IS NULL OR (SELECT COUNT(*) FROM enrollments WHERE course_id=? AND status IN ('active','pending'))<(SELECT capacity FROM courses WHERE id=?)`,
    id,
    user.id,
    COURSE_ID,
    POLICY_VERSION,
    COURSE_ID,
    COURSE_ID,
    COURSE_ID,
  );
  await insert.run();
  const reserved = await first<{ id: string }>(
    e,
    "SELECT id FROM enrollments WHERE user_id=? AND course_id=? AND status='pending'",
    user.id,
    COURSE_ID,
  );
  assert(reserved, 409, 'This cohort is currently full.');
  await e.DB.batch([
    statement(
      e,
      'UPDATE users SET name=?,phone=?,age_category=?,experience=?,project_interest=?,updates_opt_in=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',
      data.name,
      data.phone,
      data.ageCategory,
      data.experience,
      data.projectInterest,
      Number(data.updatesOptIn),
      user.id,
    ),
    ...(data.ageCategory === 'minor'
      ? [
          statement(
            e,
            'INSERT INTO guardians(user_id,name,email,phone,learner_email,consent_at,consent_version,verified_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,email=excluded.email,phone=excluded.phone,learner_email=excluded.learner_email,consent_at=excluded.consent_at,consent_version=excluded.consent_version,verified_at=excluded.verified_at',
            user.id,
            data.guardianName,
            user.email,
            data.guardianPhone,
            data.learnerEmail,
            POLICY_VERSION,
          ),
        ]
      : [statement(e, 'DELETE FROM guardians WHERE user_id=?', user.id)]),
  ]);
  return initialize(e, user, reserved.id, raw.expectedAmount);
}
export async function initialize(
  e: AppEnv,
  user: User,
  enrollmentId: string,
  expectedAmount: number,
) {
  paystackKey(e);
  const c = await course(e);
  assert(registrationAvailable(c), 409, 'Registration is currently closed.');
  const price = quote(c);
  assert(
    price.amount === expectedAmount,
    409,
    'The program price has changed. Refresh to review it.',
  );
  const en = await first<{ status: string }>(
    e,
    'SELECT status FROM enrollments WHERE id=? AND user_id=?',
    enrollmentId,
    user.id,
  );
  assert(en?.status === 'pending', 409, 'Only your pending enrollment can be paid.');
  const pending = await first<Transaction>(
    e,
    "SELECT * FROM transactions WHERE enrollment_id=? AND status='pending'",
    enrollmentId,
  );
  if (pending) {
    // Never invalidate an in-flight payment or start another attempt until Paystack has answered.
    if (
      pending.checkout_url &&
      pending.amount === price.amount &&
      Date.now() - new Date(pending.created_at + 'Z').getTime() < 3600000
    )
      return Response.json({
        url: pending.checkout_url,
        amount: pending.amount,
        reference: pending.reference,
      });
    const checked = await verifyPayment(e, pending.reference);
    if (checked.status === 'success')
      return Response.json({
        url: '/portal',
        amount: pending.amount,
        reference: pending.reference,
      });
    assert(
      ['failed', 'abandoned'].includes(checked.status),
      409,
      'Your previous payment is still processing. Verify it from the payment page before retrying.',
    );
  }
  const reference = 'sanaa-' + crypto.randomUUID(),
    id = crypto.randomUUID();
  try {
    await statement(
      e,
      'INSERT INTO transactions(id,reference,enrollment_id,payer_email,amount,pricing_tier,provider_mode) VALUES(?,?,?,?,?,?,?)',
      id,
      reference,
      enrollmentId,
      user.email,
      price.amount,
      price.tier,
      e.PAYSTACK_MODE,
    ).run();
  } catch {
    throw new HttpError(409, 'A checkout is already being prepared. Refresh to resume it.');
  }
  try {
    const result = z.object({ authorization_url: z.string().url(), reference: z.string() }).parse(
      await paystack(e, '/transaction/initialize', {
        email: user.email,
        amount: String(price.amount),
        currency: 'KES',
        reference,
        callback_url: new URL('/payment', e.APP_URL).href,
        channels: ['card', 'mobile_money'],
        metadata: JSON.stringify({ enrollment_id: enrollmentId }),
      }),
    );
    const url = new URL(result.authorization_url);
    assert(
      url.protocol === 'https:' &&
        (url.hostname === 'checkout.paystack.com' || url.hostname.endsWith('.paystack.com')) &&
        result.reference === reference,
      502,
      'Unexpected checkout response.',
    );
    await statement(
      e,
      'UPDATE transactions SET checkout_url=? WHERE id=?',
      result.authorization_url,
      id,
    ).run();
    return Response.json({ url: result.authorization_url, reference, amount: price.amount });
  } catch (error) {
    if (error instanceof HttpError && [400, 404].includes(error.status))
      await statement(
        e,
        "UPDATE transactions SET status='failed' WHERE id=? AND status='pending'",
        id,
      ).run();
    // An ambiguous timeout can still have initialized at Paystack; preserve the reference for reconciliation.
    throw error;
  }
}
export async function settle(e: AppEnv, data: VerifiedPayment) {
  const tx = await first<Transaction>(
    e,
    'SELECT * FROM transactions WHERE reference=?',
    data.reference,
  );
  assert(tx, 404, 'Payment reference was not found.');
  assert(paymentMatches(tx, data), 400, 'Payment details do not match this enrollment.');
  if (['refunded', 'reversed'].includes(tx.status))
    return { status: tx.status, reference: tx.reference };
  const pendingSecret = await first<{ user_id: string; password_hash: string }>(
    e,
    'SELECT rs.user_id,rs.password_hash FROM registration_secrets rs JOIN enrollments en ON en.user_id=rs.user_id WHERE en.id=?',
    tx.enrollment_id,
  );
  const statements = [];
  if (pendingSecret) {
    statements.push(
      statement(
        e,
        'UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND password_hash IS NULL',
        pendingSecret.password_hash,
        pendingSecret.user_id,
      ),
      statement(e, 'DELETE FROM registration_secrets WHERE user_id=?', pendingSecret.user_id),
    );
  }
  statements.push(
    statement(
      e,
      "UPDATE transactions SET status='success',provider_id=?,method=?,verified_at=CURRENT_TIMESTAMP,paid_at=? WHERE reference=? AND status NOT IN ('success','refunded','reversed')",
      String(data.id),
      data.channel ?? null,
      data.paid_at ?? new Date().toISOString(),
      tx.reference,
    ),
  );
  // D1 commits the account credential, secret removal, and payment activation together.
  await e.DB.batch(statements);
  // Failure is recorded for retry; it cannot affect settlement.
  if (e.RESEND_API_KEY && e.EMAIL_FROM) await deliverEmail(e, 'welcome-' + tx.enrollment_id);
  return { status: 'success', reference: tx.reference };
}
export async function verifyPayment(e: AppEnv, reference: string) {
  assert(/^sanaa-[a-f0-9-]{36}$/.test(reference), 400, 'Invalid payment reference.');
  const tx = await first<Transaction>(e, 'SELECT * FROM transactions WHERE reference=?', reference);
  assert(tx, 404, 'Payment reference not found.');
  let providerData: unknown;
  try {
    providerData = await paystack(e, '/transaction/verify/' + encodeURIComponent(reference));
  } catch (error) {
    if (
      error instanceof HttpError &&
      error.status === 404 &&
      tx.status === 'pending' &&
      Date.now() - new Date(tx.created_at + 'Z').getTime() > 90000
    ) {
      await statement(
        e,
        "UPDATE transactions SET status='abandoned',verified_at=CURRENT_TIMESTAMP WHERE reference=? AND status='pending'",
        reference,
      ).run();
      return { status: 'abandoned', reference };
    }
    throw error;
  }
  const parsed = verifiedSchema.parse(providerData);
  if (parsed.status === 'success')
    return settle(e, {
      ...parsed,
      paid_at: parsed.paid_at ?? undefined,
      metadata:
        typeof parsed.metadata === 'object' && parsed.metadata ? parsed.metadata : undefined,
    });
  assert(
    parsed.reference === tx.reference &&
      parsed.amount === tx.amount &&
      parsed.currency === tx.currency &&
      parsed.domain === tx.provider_mode,
    400,
    'Payment verification mismatch.',
  );
  const status = ['failed', 'abandoned', 'reversed'].includes(parsed.status)
    ? parsed.status
    : 'pending';
  if (!['refunded', 'reversed'].includes(tx.status))
    await statement(
      e,
      "UPDATE transactions SET status=?,verified_at=CURRENT_TIMESTAMP WHERE reference=? AND (status!='success' OR ?='reversed')",
      status,
      reference,
      status,
    ).run();
  return {
    status: ['refunded', 'reversed'].includes(tx.status)
      ? tx.status
      : tx.status === 'success' && status !== 'reversed'
        ? 'success'
        : status,
    reference,
  };
}
export async function webhook(request: Request, e: AppEnv) {
  assert(e.PAYSTACK_SECRET_KEY, 503, 'Payment service is not configured');
  assert(Number(request.headers.get('content-length') ?? 0) <= 65536, 413, 'Payload too large');
  const reader = request.body?.getReader();
  assert(reader, 400, 'Missing body');
  let raw = '';
  const decoder = new TextDecoder();
  let size = 0;
  while (true) {
    const v = await reader.read();
    if (v.done) break;
    size += v.value.length;
    if (size > 65536) {
      await reader.cancel();
      throw new HttpError(413, 'Payload too large');
    }
    raw += decoder.decode(v.value, { stream: true });
  }
  raw += decoder.decode();
  assert(
    await verifyWebhook(
      raw,
      request.headers.get('x-paystack-signature') ?? '',
      e.PAYSTACK_SECRET_KEY,
    ),
    401,
    'Invalid webhook signature',
  );
  const event = z
    .object({ event: z.string(), data: z.record(z.string(), z.unknown()) })
    .parse(JSON.parse(raw));
  const key = await digest(raw);
  if (await first(e, 'SELECT id FROM webhook_events WHERE id=?', key))
    return Response.json({ received: true });
  let reference = '';
  if (event.event === 'charge.success') {
    reference = z.string().parse(event.data.reference);
    await verifyPayment(e, reference);
  } else if (event.event === 'refund.processed') {
    const refund = z.object({ id: z.union([z.string(), z.number()]) }).parse(event.data);
    const result = z
      .object({
        id: z.union([z.string(), z.number()]),
        domain: z.string(),
        status: z.string(),
        amount: z.number().int(),
        currency: z.string(),
        transaction: z.union([
          z.string(),
          z.number(),
          z.object({
            id: z.union([z.string(), z.number()]).optional(),
            reference: z.string().optional(),
          }),
        ]),
      })
      .parse(await paystack(e, '/refund/' + encodeURIComponent(String(refund.id))));
    const providerId =
      typeof result.transaction === 'object'
        ? String(result.transaction.id ?? '')
        : String(result.transaction);
    const providerReference =
      typeof result.transaction === 'object' ? (result.transaction.reference ?? '') : '';
    const tx = await first<Transaction>(
      e,
      'SELECT * FROM transactions WHERE provider_id=? OR reference=?',
      providerId,
      providerReference,
    );
    assert(
      tx &&
        String(result.id) === String(refund.id) &&
        result.domain === tx.provider_mode &&
        result.status === 'processed' &&
        result.currency === tx.currency &&
        result.amount === tx.amount,
      400,
      'Refund requires reconciliation. Only confirmed full refunds revoke access.',
    );
    reference = tx.reference;
    await statement(
      e,
      "UPDATE transactions SET status='refunded',verified_at=CURRENT_TIMESTAMP WHERE reference=? AND status='success'",
      reference,
    ).run();
  } else if (event.event === 'charge.dispute.resolve') {
    const dispute = z
      .object({ resolution: z.string(), transaction: z.object({ reference: z.string() }) })
      .parse(event.data);
    reference = dispute.transaction.reference;
    if (dispute.resolution === 'merchant-accepted')
      await statement(
        e,
        "UPDATE transactions SET status='reversed',verified_at=CURRENT_TIMESTAMP WHERE reference=? AND status='success'",
        reference,
      ).run();
  }
  await statement(
    e,
    'INSERT OR IGNORE INTO webhook_events(id,event,reference) VALUES(?,?,?)',
    key,
    event.event,
    reference,
  ).run();
  return Response.json({ received: true });
}
export async function paymentForUser(e: AppEnv, userId: string, reference: string) {
  return first<Transaction>(
    e,
    'SELECT t.* FROM transactions t JOIN enrollments en ON en.id=t.enrollment_id WHERE t.reference=? AND en.user_id=?',
    reference,
    userId,
  );
}
export async function enrollmentState(e: AppEnv, userId: string) {
  return {
    enrollment: await first(
      e,
      'SELECT * FROM enrollments WHERE user_id=? AND course_id=?',
      userId,
      COURSE_ID,
    ),
    transactions: await all(
      e,
      'SELECT t.reference,t.amount,t.currency,t.status,t.created_at,t.paid_at FROM transactions t JOIN enrollments en ON en.id=t.enrollment_id WHERE en.user_id=? ORDER BY t.created_at DESC',
      userId,
    ),
  };
}
