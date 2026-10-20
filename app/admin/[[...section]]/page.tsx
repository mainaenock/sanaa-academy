import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { sessionFromCookie } from '@/lib/auth';
import { runtime } from '@/lib/db';
import { AdminApp } from '@/components/admin-app';
export const metadata = { title: 'Administration', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Admin({ params }: { params: Promise<{ section?: string[] }> }) {
  const e = runtime(),
    s = await sessionFromCookie(e, (await cookies()).toString());
  if (!s) redirect('/login?next=/admin');
  if (s.user.role !== 'admin')
    return (
      <main id="main" className="narrow page-content">
        <div className="card">
          <h1>Administrator access required</h1>
          <p>This account does not have access to academy management.</p>
          <a className="btn" href="/portal">
            Open student portal
          </a>
        </div>
      </main>
    );
  const segments = (await params).section ?? [],
    section = segments[0] ?? '';
  if (
    ![
      '',
      'students',
      'curriculum',
      'sessions',
      'payments',
      'announcements',
      'website',
      'settings',
      'emails',
      'privacy',
      'audit',
    ].includes(section)
  )
    notFound();
  return (
    <AdminApp
      user={s.user}
      csrf={s.csrf}
      section={section}
      studentId={section === 'students' ? segments[1] : undefined}
    />
  );
}
