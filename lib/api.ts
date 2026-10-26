import { z } from 'zod';
import { adminDelete, adminRead, adminWrite, exportStudents } from './admin';
import { logout, loginPassword, requireEnrollment, requireSession } from './auth';
import { course, first, checkoutReady, site, statement, type AppEnv } from './db';
import { assert, errorResponse, jsonBody, rateLimit, sameOrigin, HttpError } from './http';
import {
  enroll,
  enrollmentState,
  initialize,
  paymentForUser,
  verifyPayment,
  webhook,
} from './payments';
import { privacy, studentData, submitAssignment, updateProfile, updateProgress } from './student';
import { quote, registrationAvailable } from './domain';
import { digest } from './crypto';
import { resendWelcome } from './email';
export async function handleApi(request: Request, e: AppEnv): Promise<Response> {
  try {
    const url = new URL(request.url),
      path = url.pathname.replace(/^\/api\//, '');
    if (path === 'webhooks/paystack' && request.method === 'POST') return await webhook(request, e);
    if (!['GET', 'HEAD'].includes(request.method)) sameOrigin(request, e);
    if (path === 'public' && request.method === 'GET') {
      const c = await course(e);
      return Response.json({
        course: c,
        site: await site(e),
        quote: quote(c),
        registrationAvailable: registrationAvailable(c),
        ready: checkoutReady(e),
        turnstileSiteKey: e.TURNSTILE_SITE_KEY ?? '',
      });
    }
    if (path === 'auth/login' && request.method === 'POST')
      return await loginPassword(request, e, await jsonBody(request));
    if (path === 'auth/logout' && request.method === 'POST') return await logout(request, e);
    if (path === 'unsubscribe' && request.method === 'POST') {
      const v = z
        .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
        .parse(await jsonBody(request));
      const row = await statement(
        e,
        "UPDATE auth_tokens SET consumed_at=? WHERE token_hash=? AND purpose='unsubscribe' AND expires_at>? RETURNING email",
        Math.floor(Date.now() / 1000),
        await digest(v.token),
        Math.floor(Date.now() / 1000),
      ).first<{ email: string }>();
      assert(
        row,
        400,
        'This unsubscribe link has expired. You can change email preferences in your profile.',
      );
      await statement(e, 'UPDATE users SET updates_opt_in=0 WHERE email=?', row.email).run();
      return Response.json({ message: 'You have unsubscribed from course update emails.' });
    }
    if (path === 'payments/verify-public' && request.method === 'POST') {
      const v = z.object({ reference: z.string() }).parse(await jsonBody(request));
      await rateLimit(e, 'public-payment-verify:' + request.headers.get('cf-connecting-ip'), 30);
      return Response.json(await verifyPayment(e, v.reference));
    }
    if (path === 'enroll' && request.method === 'POST')
      return await enroll(request, e, await jsonBody(request));
    const s = await requireSession(request, e, path.startsWith('admin/'));
    if (path === 'me' && request.method === 'GET')
      return Response.json({
        user: s.user,
        csrf: s.csrf,
        ...(await enrollmentState(e, s.user.id)),
      });
    if (path === 'checkout/resume' && request.method === 'POST') {
      await rateLimit(e, 'checkout:' + s.user.id, 8);
      const v = z.object({ expectedAmount: z.number().int() }).parse(await jsonBody(request));
      const en = await first<{ id: string }>(
        e,
        "SELECT id FROM enrollments WHERE user_id=? AND status='pending'",
        s.user.id,
      );
      assert(en, 404, 'Pending registration not found');
      return await initialize(e, s.user, en.id, v.expectedAmount);
    }
    if (path === 'payments/verify' && request.method === 'POST') {
      const v = z.object({ reference: z.string() }).parse(await jsonBody(request));
      await rateLimit(e, 'payment-verify:' + s.user.id, 30);
      assert(await paymentForUser(e, s.user.id, v.reference), 404, 'Payment not found');
      return Response.json(await verifyPayment(e, v.reference));
    }
    if (path === 'student' && request.method === 'GET')
      return Response.json(await studentData(e, s.user.id));
    if (path === 'student/resend' && request.method === 'POST') {
      await requireEnrollment(e, s.user.id);
      await rateLimit(e, 'welcome-resend:' + s.user.id, 3, 86400);
      const sent = await resendWelcome(e, s.user.id);
      return Response.json({
        message: sent
          ? 'Your enrollment confirmation has been sent.'
          : 'Delivery failed; your enrollment remains active. Please try again later.',
      });
    }
    if (path === 'student/progress' && request.method === 'POST')
      return await updateProgress(request, e, await jsonBody(request));
    if (path === 'student/submissions' && request.method === 'POST')
      return await submitAssignment(request, e, await jsonBody(request));
    if (path === 'profile' && request.method === 'POST')
      return await updateProfile(request, e, await jsonBody(request));
    if (path === 'privacy' && request.method === 'POST')
      return await privacy(request, e, await jsonBody(request));
    if (path === 'admin/export' && request.method === 'GET')
      return await exportStudents(request, e, url);
    if (path === 'admin/progress' && request.method === 'POST')
      return await updateProgress(request, e, await jsonBody(request), true);
    if (path === 'admin/reconcile' && request.method === 'POST') {
      const v = z.object({ reference: z.string() }).parse(await jsonBody(request));
      const result = await verifyPayment(e, v.reference);
      await statement(
        e,
        'INSERT INTO admin_audit_logs(id,actor_id,action,entity_type,entity_id) VALUES(?,?,?,?,?)',
        crypto.randomUUID(),
        s.user.id,
        'reconcile',
        'transactions',
        v.reference,
      ).run();
      return Response.json(result);
    }
    if (path.startsWith('admin/')) {
      const resource = path.slice(6);
      if (request.method === 'GET') return Response.json(await adminRead(e, resource, url));
      if (request.method === 'POST')
        return Response.json(await adminWrite(request, e, resource, await jsonBody(request)));
      if (request.method === 'DELETE')
        return Response.json(
          await adminDelete(request, e, resource, url.searchParams.get('id') ?? ''),
        );
    }
    throw new HttpError(404, 'Endpoint not found.');
  } catch (error) {
    return errorResponse(error);
  }
}
