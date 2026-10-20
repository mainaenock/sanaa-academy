'use client';
import { useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Layers3,
  TrendingUp,
} from 'lucide-react';
import type { User } from '@/lib/auth';
import type { StudentData, Assignment, LiveSession } from '@/lib/view-types';
import { currentWeek } from '@/lib/format';
import { api, formValues } from './client-api';
import { WorkspaceShell } from './workspace-shell';
export function StudentApp({
  user,
  csrf,
  initialData,
  section,
  lessonId,
}: {
  user: User;
  csrf: string;
  initialData: StudentData | null;
  section: string;
  lessonId?: string;
}) {
  const [data, setData] = useState(initialData),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function act(path: string, body: unknown, success: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api(path, body, csrf);
      if (data) setData(await api<StudentData>('student'));
      setMessage(success);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const completed = new Set(data?.progress.map((p) => p.lesson_id)),
    total = data?.lessons.length ?? 0,
    done = data?.lessons.filter((l) => completed.has(l.id)).length ?? 0,
    percent = total ? Math.round((done / total) * 100) : 0;
  const next = data?.lessons.find((l) => !completed.has(l.id)),
    date = (d: string) =>
      new Date(d).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: data?.course.timezone ?? 'Africa/Nairobi',
      });
  const upcoming = data?.sessions.find(
    (s) => s.status === 'scheduled' && new Date(s.ends_at) > new Date(),
  );
  function sessionCard(s: LiveSession) {
    return (
      <article className="card" key={s.id}>
        <div className="toolbar">
          <span className={'status ' + s.status}>{s.status}</span>
          <span className="tiny">{s.platform}</span>
        </div>
        <h3>{s.title}</h3>
        <p className="muted">
          {date(s.starts_at)} —{' '}
          {new Date(s.ends_at).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: data?.course.timezone,
          })}
          <br />
          {data?.course.timezone}
        </p>
        {s.notes && <p style={{ whiteSpace: 'pre-wrap' }}>{s.notes}</p>}
        {s.meeting_url && s.status === 'scheduled' ? (
          <a className="btn" href={s.meeting_url} target="_blank" rel="noopener noreferrer">
            Join class <ExternalLink size={14} />
          </a>
        ) : (
          <div className="notice">
            {s.status === 'scheduled'
              ? 'The joining link will be published here when ready.'
              : 'This session is ' + s.status + '.'}
          </div>
        )}
      </article>
    );
  }
  function assignmentCard(a: Assignment) {
    const submission = data?.submissions.find((s) => s.assignment_id === a.id);
    return (
      <article className="card" key={a.id}>
        <div className="toolbar">
          <span className={'status ' + (submission?.status ?? '')}>
            {submission?.status ?? 'Not submitted'}
          </span>
          {a.due_at && <span className="tiny">Due {date(a.due_at)}</span>}
        </div>
        <h3>{a.title}</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{a.description}</p>
        {submission?.feedback && (
          <div className="notice">
            <strong>Instructor feedback</strong>
            <p>{submission.feedback}</p>
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const v = formValues(event.currentTarget);
            void act(
              'student/submissions',
              {
                assignmentId: a.id,
                description: v.description,
                githubUrl: v.githubUrl,
                websiteUrl: v.websiteUrl,
              },
              'Project submission saved.',
            );
          }}
        >
          <div className="form-grid">
            <label className="field full">
              <span>Your project description</span>
              <textarea
                name="description"
                defaultValue={submission?.description ?? ''}
                minLength={20}
                maxLength={10000}
                required
              />
            </label>
            <label className="field">
              <span>GitHub repository URL (optional)</span>
              <input
                name="githubUrl"
                type="url"
                placeholder="https://github.com/…"
                defaultValue={submission?.github_url ?? ''}
              />
            </label>
            <label className="field">
              <span>Live website URL (optional)</span>
              <input
                name="websiteUrl"
                type="url"
                placeholder="https://…"
                defaultValue={submission?.website_url ?? ''}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn" disabled={busy}>
              {busy ? 'Saving…' : submission ? 'Update submission' : 'Submit project'}
              <ArrowUpRight size={14} />
            </button>
          </div>
        </form>
      </article>
    );
  }
  let content: React.ReactNode;
  if (section === 'profile') content = <Profile user={user} csrf={csrf} busy={busy} act={act} />;
  else if (!data)
    content = (
      <div className="card">
        <h2>Your classroom is one step away.</h2>
        <p>
          Portal access begins after your enrollment payment is verified. Resume your registration
          to complete checkout or check a payment already made.
        </p>
        <div className="form-actions">
          <a className="btn" href="/register">
            Continue registration <ArrowUpRight size={15} />
          </a>
          <a className="btn btn-light" href="/payment">
            Check payment
          </a>
        </div>
      </div>
    );
  else if (section === 'curriculum') {
    const lesson = data.lessons.find((l) => l.id === lessonId);
    content = lesson ? (
      <div className="lesson-layout">
        <nav className="lesson-nav" aria-label="Course lessons">
          {data.lessons.map((l) => (
            <a
              key={l.id}
              href={'/portal/curriculum/' + l.id}
              className={l.id === lesson.id ? 'active' : ''}
            >
              {completed.has(l.id) ? '✓ ' : ''}
              {l.title}
            </a>
          ))}
        </nav>
        <div className="stack">
          <article className="card">
            <div className="eyebrow">YOUR NEXT BUILDING BLOCK</div>
            <h2 style={{ marginTop: 14 }}>{lesson.title}</h2>
            <p className="muted">{lesson.description}</p>
            <div className="notice">
              <strong>Learning outcomes</strong>
              <p>{lesson.outcomes}</p>
            </div>
            <div className="lesson-content">
              {lesson.content || 'Your instructor is preparing the lesson content.'}
            </div>
            <div className="form-actions">
              <button
                className={'btn ' + (completed.has(lesson.id) ? 'btn-light' : '')}
                disabled={busy}
                onClick={() =>
                  void act(
                    'student/progress',
                    { lessonId: lesson.id, completed: !completed.has(lesson.id) },
                    'Progress updated.',
                  )
                }
              >
                <CheckCircle2 size={16} />
                {completed.has(lesson.id) ? 'Completed · mark incomplete' : 'Mark lesson complete'}
              </button>
            </div>
            <p className="tiny">
              Completion records your learning activity. It does not certify mastery.
            </p>
            {data.resources
              .filter((r) => r.lesson_id === lesson.id)
              .map((r) => (
                <div className="list-row" key={r.id}>
                  <div>
                    <strong>{r.title}</strong>
                    <small>{r.kind}</small>
                  </div>
                  <a className="text-link" href={r.url} target="_blank" rel="noreferrer">
                    Open resource ↗
                  </a>
                </div>
              ))}
          </article>
          {data.assignments.filter((a) => a.lesson_id === lesson.id).map(assignmentCard)}
        </div>
      </div>
    ) : (
      <div className="stack">
        {data.weeks.map((w) => {
          const modules = data.modules.filter((m) => m.week_id === w.id);
          const lessonIds = data.lessons.filter((l) => modules.some((m) => m.id === l.module_id));
          const weekDone = lessonIds.filter((l) => completed.has(l.id)).length;
          return (
            <article className="card" key={w.id}>
              <div className="toolbar">
                <span className="pill">WEEK {w.position}</span>
                <span className="tiny">
                  {weekDone} / {lessonIds.length} lessons complete
                </span>
              </div>
              <h2>{w.title}</h2>
              <p className="muted">{w.description}</p>
              <Progress percent={lessonIds.length ? (weekDone / lessonIds.length) * 100 : 0} />
              {modules.length ? (
                modules.map((m) => (
                  <div key={m.id} style={{ marginTop: 25 }}>
                    <h3>{m.title}</h3>
                    {data.lessons
                      .filter((l) => l.module_id === m.id)
                      .map((l) => (
                        <a className="list-row" key={l.id} href={'/portal/curriculum/' + l.id}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            {completed.has(l.id) ? (
                              <CheckCircle2 size={19} color="#7aa252" />
                            ) : (
                              <BookOpen size={18} color="#8896ac" />
                            )}
                            <div>
                              <strong>{l.title}</strong>
                              <small>{l.description}</small>
                            </div>
                          </div>
                          <ArrowUpRight size={16} />
                        </a>
                      ))}
                  </div>
                ))
              ) : (
                <div className="empty">Modules are being prepared for this week.</div>
              )}
            </article>
          );
        })}
      </div>
    );
  } else if (section === 'sessions')
    content = (
      <div className="stack">
        <div className="notice">
          {data.course.timetable} All session times below use {data.course.timezone}.
        </div>
        {data.sessions.length ? (
          data.sessions.map(sessionCard)
        ) : (
          <div className="empty">
            <CalendarDays style={{ margin: '0 auto 12px' }} />
            Live sessions haven’t been scheduled yet. Your joining links will appear here.
          </div>
        )}
      </div>
    );
  else if (section === 'resources')
    content = (
      <div className="curriculum-grid">
        {data.resources.length ? (
          data.resources.map((r) => (
            <article className="card" key={r.id}>
              <div className="feature-icon">
                <FileText size={20} />
              </div>
              <div className="tiny" style={{ margin: '18px 0 9px', textTransform: 'uppercase' }}>
                {r.kind}
              </div>
              <h3>{r.title}</h3>
              <p className="muted">{r.description}</p>
              <a className="text-link" href={r.url} target="_blank" rel="noopener noreferrer">
                Open resource ↗
              </a>
            </article>
          ))
        ) : (
          <div className="empty">Resources will be published here as the course progresses.</div>
        )}
      </div>
    );
  else if (section === 'assignments')
    content = (
      <div className="stack">
        {data.assignments.length ? (
          data.assignments.map(assignmentCard)
        ) : (
          <div className="empty">No assignments have been published yet.</div>
        )}
      </div>
    );
  else if (section === 'profile')
    content = <Profile user={user} csrf={csrf} busy={busy} act={act} />;
  else
    content = (
      <>
        <div className="dashboard-banner">
          <div className="eyebrow">YOUR IDEAS BELONG OUT IN THE WORLD</div>
          <h2>Small steps. Real progress.</h2>
          <p>
            {data.course.title} · {data.course.start_date} — {data.course.end_date}. Keep showing
            up, asking questions, and building.
          </p>
          <a
            className="btn btn-lime"
            href={next ? '/portal/curriculum/' + next.id : '/portal/curriculum'}
          >
            {next ? 'Continue learning' : 'Explore your curriculum'}
            <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="stat-grid">
          <Stat label="Overall progress" value={percent + '%'} icon={<TrendingUp size={17} />} />
          <Stat
            label="Lessons completed"
            value={done + ' / ' + total}
            icon={<CheckCircle2 size={17} />}
          />
          <Stat
            label="Current week"
            value={currentWeek(data.course) ? String(currentWeek(data.course)) : 'Starts soon'}
            icon={<Layers3 size={17} />}
          />
          <Stat
            label="Projects submitted"
            value={String(data.submissions.length)}
            icon={<BookOpen size={17} />}
          />
        </div>
        <div className="dashboard-grid">
          <div className="stack">
            <article className="card">
              <div className="toolbar">
                <h3>Your learning journey</h3>
                <a className="text-link" href="/portal/curriculum">
                  View curriculum ↗
                </a>
              </div>
              <Progress percent={percent} />
              <div className="progress-caption">
                <span>
                  {done} of {total} lessons completed
                </span>
                <span>{percent}%</span>
              </div>
              {data.weeks.map((w) => (
                <a className="list-row" key={w.id} href="/portal/curriculum">
                  <div>
                    <small>WEEK {w.position}</small>
                    <strong style={{ marginTop: 5 }}>{w.title}</strong>
                  </div>
                  <ArrowUpRight size={16} />
                </a>
              ))}
            </article>
            <article className="card">
              <h3>Academy announcements</h3>
              {data.announcements.length ? (
                data.announcements.map((a) => (
                  <div className="list-row" key={a.id}>
                    <div>
                      <strong>{a.title}</strong>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{a.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">
                  You’re all caught up. Course announcements will appear here.
                </div>
              )}
            </article>
          </div>
          <div className="stack">
            {upcoming ? (
              sessionCard(upcoming)
            ) : (
              <article className="card">
                <div className="feature-icon">
                  <CalendarDays size={20} />
                </div>
                <h3 style={{ marginTop: 20 }}>Your next live class</h3>
                <p className="muted">{data.course.timetable}</p>
                <div className="notice">
                  Session details and your private joining link will appear here once scheduled.
                </div>
              </article>
            )}
            <article className="card">
              <h3>A reminder for the journey</h3>
              <p className="muted">
                AI is your building partner. You are the planner, designer, tester, and
                decision-maker. Take time to understand what you launch.
              </p>
              <div className="pill">
                <Clock3 size={13} /> Learn at a thoughtful pace.
              </div>
            </article>
          </div>
        </div>
      </>
    );
  const names: Record<string, string> = {
    '': 'Your learning, in motion.',
    curriculum: 'Your curriculum',
    sessions: 'Meet. Learn. Build.',
    resources: 'Your builder’s toolkit',
    assignments: 'Make the learning yours.',
    profile: 'Your account, your control.',
  };
  return (
    <WorkspaceShell section={section} name={user.name} email={user.email} csrf={csrf}>
      <div className="workspace-title">
        <div>
          <div className="eyebrow">{section ? 'YOUR LEARNING SPACE' : 'GOOD TO HAVE YOU HERE'}</div>
          <h1>
            {section
              ? (names[section] ?? 'Your learning space')
              : `Welcome, ${user.name.split(' ')[0] || 'builder'}.`}
          </h1>
          <p>
            {section === 'curriculum'
              ? 'One building block at a time.'
              : 'A little progress today. A world of possibility tomorrow.'}
          </p>
        </div>
        <span className="pill">
          <span className="live-dot" />
          {data ? 'Enrolled learner' : 'Enrollment pending'}
        </span>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
      {content}
    </WorkspaceShell>
  );
}
export function Progress({ percent }: { percent: number }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-label="Lesson completion"
    >
      <span style={{ width: Math.max(0, Math.min(100, percent)) + '%' }} />
    </div>
  );
}
export function Stat({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  note?: string;
}) {
  return (
    <article className="stat-card">
      <span>
        {label}
        {icon}
      </span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}
function Profile({
  user,
  csrf,
  busy,
  act,
}: {
  user: User;
  csrf: string;
  busy: boolean;
  act: (path: string, body: unknown, message: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  async function exportData() {
    try {
      const result = await api('privacy', { kind: 'export' }, csrf);
      const link = document.createElement('a'),
        url = URL.createObjectURL(
          new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }),
        );
      link.href = url;
      link.download = 'sanaa-personal-data.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setNote((error as Error).message);
    }
  }
  return (
    <div className="stack">
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          const v = formValues(event.currentTarget);
          void act(
            'profile',
            {
              name: v.name,
              phone: v.phone,
              projectInterest: v.projectInterest,
              updatesOptIn: v.updatesOptIn === 'on',
            },
            'Profile saved.',
          );
        }}
      >
        <h2>Your profile</h2>
        <div className="form-grid">
          <label className="field">
            <span>Learner name</span>
            <input name="name" required minLength={2} defaultValue={user.name} />
          </label>
          <label className="field">
            <span>Phone</span>
            <input name="phone" type="tel" required defaultValue={user.phone} />
          </label>
          <label className="field full">
            <span>Verified account email</span>
            <input value={user.email} readOnly />
            <small>
              {user.age_category === 'minor'
                ? 'This is the guardian’s account email. Contact the academy to change guardian details.'
                : 'Contact the academy to request an account email change.'}
            </small>
          </label>
          <label className="field full">
            <span>Your project idea</span>
            <textarea
              name="projectInterest"
              defaultValue={user.project_interest}
              maxLength={2000}
            />
          </label>
          <label className="checkbox full">
            <input name="updatesOptIn" type="checkbox" defaultChecked={!!user.updates_opt_in} />
            Receive optional course announcements by email.
          </label>
        </div>
        <div className="form-actions">
          <button className="btn" disabled={busy}>
            Save profile <Check size={14} />
          </button>
        </div>
      </form>
      <article className="card">
        <h2>Privacy & account controls</h2>
        <p className="muted">
          Download your personal data or request account deletion. The academy reviews deletion
          requests and retains necessary financial and audit records according to its retention
          policy.
        </p>
        {note && <div className="notice error">{note}</div>}
        <div className="form-actions">
          <button className="btn btn-light" onClick={exportData}>
            Download my data
          </button>
          <button
            className="btn btn-danger"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  'Request deletion of your account and learning data? This request will be reviewed by the academy.',
                )
              )
                void act(
                  'privacy',
                  { kind: 'delete' },
                  'Deletion request recorded. The academy will review it.',
                );
            }}
          >
            Request account deletion
          </button>
        </div>
      </article>
    </div>
  );
}
