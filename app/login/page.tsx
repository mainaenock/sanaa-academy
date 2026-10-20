import { Header, Footer } from '@/components/public-shell';
import { LoginForm } from '@/components/login-form';
import { runtime, site } from '@/lib/db';
export const metadata = { title: 'Sign in', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const e = runtime(),
    s = await site(e),
    p = await searchParams;
  const next = p.next?.startsWith('/admin')
    ? '/admin'
    : p.next === '/register'
      ? '/register'
      : '/portal';
  return (
    <>
      <Header />
      <main id="main" className="page-content">
        <div className="narrow" style={{ maxWidth: 530, paddingTop: 28 }}>
          <LoginForm
            siteKey={e.TURNSTILE_SITE_KEY ?? ''}
            ready={!!(e.RESEND_API_KEY && e.EMAIL_FROM && e.TURNSTILE_SECRET_KEY)}
            next={next}
          />
        </div>
      </main>
      <Footer site={s} />
    </>
  );
}
