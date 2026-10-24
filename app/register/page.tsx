import { cookies } from 'next/headers';
import { Header, Footer } from '@/components/public-shell';
import { RegisterForm } from '@/components/register-form';
import { runtime, course, site, first, providersReady } from '@/lib/db';
import { sessionFromCookie } from '@/lib/auth';
import { quote, registrationAvailable } from '@/lib/domain';
export const metadata = {
  title: 'Register for the bootcamp',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';
export default async function Register() {
  const e = runtime(),
    [c, s, session] = await Promise.all([
      course(e),
      site(e),
      sessionFromCookie(e, (await cookies()).toString()),
    ]);
  const existing = session
    ? await first<{ id: string; status: string }>(
        e,
        'SELECT id,status FROM enrollments WHERE user_id=? AND course_id=?',
        session.user.id,
        c.id,
      )
    : null;
  const guardian = session
    ? await first<{ name: string; email: string; phone: string; learner_email: string }>(
        e,
        'SELECT * FROM guardians WHERE user_id=?',
        session.user.id,
      )
    : null;
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero">
          <div className="narrow">
            <div className="eyebrow">A SMALL STEP. A NEW POSSIBILITY.</div>
            <h1>Let’s make your idea real.</h1>
            <p>
              Add your learner details, choose card or M-PESA at secure checkout, and pay to join
              the next Sanaa Academy cohort. Your account activates after payment is confirmed.
            </p>
          </div>
        </section>
        <section className="page-content">
          <div className="narrow">
            <RegisterForm
              user={session?.user ?? null}
              csrf={session?.csrf ?? ''}
              siteKey={e.TURNSTILE_SITE_KEY ?? ''}
              ready={providersReady(e)}
              available={registrationAvailable(c)}
              initialQuote={quote(c)}
              course={c}
              existing={existing}
              guardian={guardian}
            />
          </div>
        </section>
      </main>
      <Footer site={s} />
    </>
  );
}
