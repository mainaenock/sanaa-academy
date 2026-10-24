import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Header, Footer } from '@/components/public-shell';
import { PaymentStatus } from '@/components/payment-status';
import { PublicPaymentStatus } from '@/components/public-payment-status';
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
  const s = await site(e),
    p = await searchParams,
    publicPayment = !session && p.reference
      ? await all<{
          reference: string;
          amount: number;
          currency: string;
          status: string;
          paid_at: string | null;
        }>(
          e,
          'SELECT reference,amount,currency,status,paid_at FROM transactions WHERE reference=?',
          p.reference,
        )
      : [],
    payments = await all<{
      reference: string;
      amount: number;
      currency: string;
      status: string;
      paid_at: string | null;
    }>(
      e,
      'SELECT t.reference,t.amount,t.currency,t.status,t.paid_at FROM transactions t JOIN enrollments en ON en.id=t.enrollment_id WHERE en.user_id=? ORDER BY t.created_at DESC',
      session?.user.id ?? '',
    );
  if (!session && !publicPayment.length) redirect('/login');
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <div className="narrow">
          {session ? (
            <PaymentStatus csrf={session.csrf} payments={payments} reference={p.reference} />
          ) : (
            <PublicPaymentStatus
              reference={publicPayment[0].reference}
              amount={publicPayment[0].amount}
              currency={publicPayment[0].currency}
              initialStatus={publicPayment[0].status}
            />
          )}
        </div>
      </main>
      <Footer site={s} />
    </>
  );
}
