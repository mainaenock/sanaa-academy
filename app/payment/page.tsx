import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Header, Footer } from '@/components/public-shell';
import { PaymentStatus } from '@/components/payment-status';
import { runtime, site, all } from '@/lib/db';
import { sessionFromCookie } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payment confirmation', robots: { index: false, follow: false } };
export default async function Payment({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const e = runtime(),
    session = await sessionFromCookie(e, (await cookies()).toString());
  if (!session) redirect('/login');
  const s = await site(e),
    p = await searchParams,
    payments = await all<{
      reference: string;
      amount: number;
      currency: string;
      status: string;
      paid_at: string | null;
    }>(
      e,
      'SELECT t.reference,t.amount,t.currency,t.status,t.paid_at FROM transactions t JOIN enrollments en ON en.id=t.enrollment_id WHERE en.user_id=? ORDER BY t.created_at DESC',
      session.user.id,
    );
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <div className="narrow">
          <PaymentStatus csrf={session.csrf} payments={payments} reference={p.reference} />
        </div>
      </main>
      <Footer site={s} />
    </>
  );
}
