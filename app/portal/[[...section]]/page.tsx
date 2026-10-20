import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { sessionFromCookie } from '@/lib/auth';
import { first, runtime } from '@/lib/db';
import { studentData } from '@/lib/student';
import { StudentApp } from '@/components/student-app';
import type { StudentData } from '@/lib/view-types';
export const metadata = { title: 'Student portal', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Portal({ params }: { params: Promise<{ section?: string[] }> }) {
  const e = runtime(),
    session = await sessionFromCookie(e, (await cookies()).toString());
  if (!session) redirect('/login');
  const segments = (await params).section ?? [],
    section = segments[0] ?? '';
  if (!['', 'curriculum', 'sessions', 'resources', 'assignments', 'profile'].includes(section))
    notFound();
  const active = await first(
    e,
    "SELECT id FROM enrollments WHERE user_id=? AND status='active'",
    session.user.id,
  );
  const data = active ? await studentData(e, session.user.id) : null;
  return (
    <StudentApp
      user={session.user}
      csrf={session.csrf}
      initialData={data as StudentData | null}
      section={section}
      lessonId={segments[1]}
    />
  );
}
