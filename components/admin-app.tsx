'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Download,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  Wallet,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import type { User } from '@/lib/auth';
import type { SiteContent } from '@/lib/defaults';
import { entities, isEntity, type EntityName } from '@/lib/admin-model';
import { money } from '@/lib/format';
import { api, formValues } from './client-api';
import { WorkspaceShell } from './workspace-shell';
import { Stat } from './student-app';
import { EntityEditor, SettingsEditor, WebsiteEditor, string, type Row } from './admin-editor';
export function AdminApp({
  user,
  csrf,
  section,
  studentId,
}: {
  user: User;
  csrf: string;
  section: string;
  studentId?: string;
}) {
  const [entity, setEntity] = useState<EntityName>('weeks'),
    [data, setData] = useState<unknown>(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [editing, setEditing] = useState<Row | null | undefined>(undefined),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState(''),
    [page, setPage] = useState(0);
  const resource = studentId
    ? 'student'
    : section === 'curriculum'
      ? entity
      : section === 'sessions'
        ? 'live_sessions'
        : section || 'overview';
  const query = studentId
    ? '?id=' + encodeURIComponent(studentId)
    : section === 'students'
      ? '?' + new URLSearchParams({ q: search, status, page: String(page) })
      : '';
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api('admin/' + resource + query));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [resource, query]);
  useEffect(() => {
    setEditing(undefined);
    void load();
  }, [load]);
  async function act(path: string, body: unknown, success = 'Changes saved.', method?: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{ message?: string; status?: string }>(
        'admin/' + path,
        body,
        csrf,
        method,
      );
      setMessage(result.message ?? (result.status ? 'Payment status: ' + result.status : success));
      await load();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const labels: Record<string, string> = {
    '': 'The academy, at a glance.',
    students: 'Every learner. One place.',
    curriculum: 'Shape the learning journey.',
    sessions: 'Bring the classroom together.',
    payments: 'Payments & reconciliation',
    website: 'Make it sound like Sanaa.',
    settings: 'Your program, your way.',
    announcements: 'Keep your learners in the loop.',
    emails: 'Email delivery & recovery',
    privacy: 'Respect every learner’s data.',
    audit: 'A record of the important things.',
  };
  let content: React.ReactNode = null;
  if (data && resource === 'overview') content = <Overview data={data as Row} />;
  else if (data && resource === 'student')
    content = <StudentDetail data={data as Row} act={act} busy={busy} />;
  else if (data && resource === 'settings')
    content = (
      <SettingsEditor
        key={string(data as Row, 'id')}
        record={data as Row}
        csrf={csrf}
        onSaved={() => void load()}
      />
    );
  else if (data && resource === 'website')
    content = <WebsiteEditor record={data as SiteContent} csrf={csrf} />;
  else if (Array.isArray(data)) {
    const rows = data as Row[];
    if (isEntity(resource))
      content = (
        <>
          <div className="toolbar">
            <p className="tiny">
              {rows.length} records · Changes are saved to the academy database.
            </p>
            <button className="btn" onClick={() => setEditing(null)}>
              <Plus size={15} />
              Add {entities[resource].label.toLowerCase()}
            </button>
          </div>
          {editing !== undefined && (
            <EntityEditor
              key={resource + String(editing?.id ?? 'new')}
              entity={resource}
              record={editing}
              csrf={csrf}
              onClose={() => setEditing(undefined)}
              onSaved={() => {
                setEditing(undefined);
                setMessage('Content saved.');
                void load();
              }}
            />
          )}
          <Table
            rows={rows}
            columns={[
              'title',
              ...(resource === 'live_sessions'
                ? ['starts_at', 'platform', 'status']
                : resource === 'lessons'
                  ? ['module_id', 'position', 'published']
                  : resource === 'announcements'
                    ? ['published', 'created_at']
                    : ['description', 'position']),
            ]}
            actions={(row) => (
              <div className="record-actions">
                <button
                  className="icon-button"
                  onClick={() => setEditing(row)}
                  aria-label={'Edit ' + string(row, 'title')}
                >
                  <Edit3 size={14} />
                </button>
                <button
                  className="icon-button"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Delete this record? Deleting a week or module also removes its child lessons and their progress.',
                      )
                    )
                      void act(
                        resource + '?id=' + encodeURIComponent(string(row, 'id')),
                        undefined,
                        'Record deleted.',
                        'DELETE',
                      );
                  }}
                  aria-label={'Delete ' + string(row, 'title')}
                >
                  <Trash2 size={14} />
                </button>
                {resource === 'announcements' && Number(row.published) === 1 && (
                  <button
                    className="btn btn-light"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          'Queue this course update for up to 20 active learners who opted in to announcement emails?',
                        )
                      )
                        void act('send-announcement', { id: row.id, confirmed: true });
                    }}
                  >
                    Email opted-in learners
                  </button>
                )}
              </div>
            )}
          />
        </>
      );
    else if (resource === 'students')
      content = (
        <>
          <div className="toolbar">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                aria-label="Search students"
                className="search-input"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
              <select
                aria-label="Enrollment status"
                className="search-input"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All statuses</option>
                {['pending', 'active', 'refunded', 'reversed', 'cancelled'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <a className="btn btn-light" href={'/api/admin/export' + query}>
              <Download size={14} />
              Export these results
            </a>
          </div>
          <Table
            rows={rows}
            columns={['name', 'email', 'phone', 'enrollment_status', 'completed_lessons']}
            actions={(row) => (
              <a className="text-link" href={'/admin/students/' + row.id}>
                View learner ↗
              </a>
            )}
          />
          <div className="form-actions">
            <button
              className="btn btn-light"
              disabled={!page}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="tiny">Page {page + 1} · up to 100 learners per page</span>
            <button
              className="btn btn-light"
              disabled={rows.length < 100}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      );
    else if (resource === 'payments')
      content = (
        <>
          <div className="notice">
            Revenue counts verified live payments. Test transactions are labelled. Reconciliation
            asks Paystack for the current transaction status; payment success cannot be set
            manually.
          </div>
          <Table
            rows={rows}
            columns={[
              'reference',
              'learner_name',
              'payer_email',
              'amount',
              'currency',
              'provider_mode',
              'status',
              'paid_at',
              'method',
            ]}
            actions={(row) => (
              <button
                className="icon-button"
                disabled={busy}
                aria-label={'Verify ' + string(row, 'reference')}
                onClick={() => void act('reconcile', { reference: row.reference })}
              >
                <RefreshCw size={14} />
              </button>
            )}
          />
        </>
      );
    else if (resource === 'emails')
      content = (
        <Table
          rows={rows}
          columns={['recipient', 'subject', 'kind', 'status', 'attempts', 'last_error', 'sent_at']}
          actions={(row) => (
            <button
              className="btn btn-light"
              disabled={busy || row.status === 'sent' || row.status === 'sending'}
              onClick={() => void act('retry-email', { id: row.id })}
            >
              Retry delivery
            </button>
          )}
        />
      );
    else if (resource === 'privacy')
      content = (
        <div className="stack">
          {rows.length ? (
            rows.map((row) => (
              <PrivacyCard key={string(row, 'id')} row={row} busy={busy} act={act} />
            ))
          ) : (
            <div className="empty">No privacy requests have been received.</div>
          )}
        </div>
      );
    else
      content = (
        <Table
          rows={rows}
          columns={['created_at', 'actor_id', 'action', 'entity_type', 'entity_id', 'details']}
        />
      );
  }
  return (
    <WorkspaceShell admin section={section} name={user.name} email={user.email} csrf={csrf}>
      <div className="workspace-title">
        <div>
          <div className="eyebrow">Sanaa Academy · Administration</div>
          <h1>{studentId ? 'Learner profile' : (labels[section] ?? 'Academy management')}</h1>
          <p>Real records, clear controls, and room to keep improving.</p>
        </div>
        <button className="icon-button" onClick={() => void load()} aria-label="Refresh dashboard">
          <RefreshCw size={16} />
        </button>
      </div>
      {section === 'curriculum' && (
        <nav className="tabs" aria-label="Content types">
          {(['weeks', 'modules', 'lessons', 'resources', 'assignments'] as EntityName[]).map(
            (key) => (
              <button
                className={entity === key ? 'active' : ''}
                key={key}
                onClick={() => setEntity(key)}
              >
                {entities[key].label}
              </button>
            ),
          )}
        </nav>
      )}
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
      {loading && (!data || resource !== 'students') ? (
        <div role="status" className="empty">
          <div className="loading" style={{ margin: '0 auto 10px' }} />
          Loading academy records…
        </div>
      ) : (
        content
      )}
    </WorkspaceShell>
  );
}
function Table({
  rows,
  columns,
  actions,
}: {
  rows: Row[];
  columns: string[];
  actions?: (row: Row) => React.ReactNode;
}) {
  return (
    <div className="card table-wrap" style={{ padding: 0 }}>
      {rows.length ? (
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col">
                  {c.replaceAll('_', ' ')}
                </th>
              ))}
              {actions && <th scope="col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={String(row.id ?? row.reference ?? i)}>
                {columns.map((c) => (
                  <td key={c} title={string(row, c)}>
                    {c === 'amount' ? (
                      money(Number(row[c]))
                    ) : c.includes('status') ? (
                      <span className={'status ' + string(row, c)}>
                        {string(row, c) || 'Not enrolled'}
                      </span>
                    ) : (
                      string(row, c) || '—'
                    )}
                  </td>
                ))}
                {actions && <td>{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty" style={{ margin: 20 }}>
          No records to show yet.
        </div>
      )}
    </div>
  );
}
function Overview({ data }: { data: Row }) {
  const counts = (data.counts ?? {}) as Row,
    payments = (data.payments ?? {}) as Row,
    progress = (data.progress ?? {}) as Row;
  const denominator = Number(counts.paid ?? 0) * Number(data.lessonCount ?? 0),
    rate = denominator ? Math.round((Number(progress.completed ?? 0) / denominator) * 100) : 0;
  return (
    <>
      <div className="stat-grid">
        <Stat
          label="Total registrations"
          value={String(counts.total ?? 0)}
          icon={<Users size={17} />}
        />
        <Stat
          label="Paid enrollments"
          value={String(counts.paid ?? 0)}
          icon={<CheckCircle2 size={17} />}
        />
        <Stat
          label="Pending enrollments"
          value={String(counts.pending ?? 0)}
          icon={<Clock3 size={17} />}
        />
        <Stat
          label="Verified live revenue"
          value={money(Number(payments.revenue ?? 0))}
          icon={<Wallet size={17} />}
        />
      </div>
      <div className="stat-grid">
        <Stat
          label="Early-bird purchases"
          value={String(payments.early ?? 0)}
          note="Verified payments, including labelled tests"
        />
        <Stat label="Regular purchases" value={String(payments.regular ?? 0)} />
        <Stat
          label="Average lesson completion"
          value={rate + '%'}
          note="Self-reported lesson activity"
        />
        <Stat label="Active students" value={String(counts.paid ?? 0)} />
      </div>
      {Number(payments.test_payments ?? 0) > 0 && (
        <div className="notice">
          {Number(payments.test_payments)} verified test payments are excluded from live revenue.
        </div>
      )}
      <div className="dashboard-grid">
        <div className="stack">
          <div>
            <div className="toolbar">
              <h2 style={{ fontWeight: 700 }}>Recent payments</h2>
              <a className="text-link" href="/admin/payments">
                View all ↗
              </a>
            </div>
            <Table
              rows={data.recent as Row[]}
              columns={['name', 'amount', 'provider_mode', 'status']}
            />
          </div>
          <div className="card">
            <h3>Upcoming live sessions</h3>
            {(data.upcoming as Row[]).length ? (
              (data.upcoming as Row[]).map((r) => (
                <div className="list-row" key={string(r, 'id')}>
                  <div>
                    <strong>{string(r, 'title')}</strong>
                    <small>
                      {string(r, 'starts_at')} · {string(r, 'platform')}
                    </small>
                  </div>
                  <CalendarDaysIcon />
                </div>
              ))
            ) : (
              <div className="empty">
                No sessions scheduled. Add dates and private joining links in Live sessions.
              </div>
            )}
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h3>Needs your attention</h3>
            <a className="list-row" href="/admin/privacy">
              <strong>Privacy requests</strong>
              <span className="pill">{String((data.privacy as Row)?.count ?? 0)}</span>
            </a>
            <a className="list-row" href="/admin/emails">
              <strong>Pending / failed emails</strong>
              <span className="pill">{String((data.emails as Row)?.count ?? 0)}</span>
            </a>
          </div>
          <div className="card">
            <h3>Keep the next cohort ready.</h3>
            <p className="muted">
              Update your timetable, instructor information, support contacts, and registration
              settings before opening enrollment.
            </p>
            <a className="btn" href="/admin/settings">
              Program settings <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
function CalendarDaysIcon() {
  return <Clock3 size={16} color="#8494ab" />;
}
function StudentDetail({
  data,
  act,
  busy,
}: {
  data: Row;
  act: (path: string, body: unknown, success?: string) => Promise<void>;
  busy: boolean;
}) {
  const user = data.user as Row,
    guardian = data.guardian as Row | null,
    completed = new Set((data.progress as Row[]).map((p) => p.lesson_id));
  return (
    <div className="stack">
      <div className="card">
        <div className="toolbar">
          <h2>{string(user, 'name') || 'New learner'}</h2>
          <span className={'status ' + string(user, 'enrollment_status')}>
            {string(user, 'enrollment_status') || 'Not enrolled'}
          </span>
        </div>
        <p>
          {string(user, 'email')} · {string(user, 'phone')}
        </p>
        <p className="tiny">
          Account created {string(user, 'created_at')} · Age category:{' '}
          {string(user, 'age_category') || 'Not provided'}
        </p>
        {guardian && (
          <div className="notice">
            <strong>Guardian consent verified</strong>
            <p>
              {string(guardian, 'name')} · {string(guardian, 'email')} · {string(guardian, 'phone')}
              <br />
              Learner email: {string(guardian, 'learner_email')}
              <br />
              Consent version {string(guardian, 'consent_version')} ·{' '}
              {string(guardian, 'consent_at')}
            </p>
          </div>
        )}
        <div className="form-actions">
          <button
            className="btn btn-light"
            disabled={busy || user.enrollment_status !== 'active'}
            onClick={() => void act('resend', { userId: user.id })}
          >
            Resend enrollment confirmation
          </button>
          {user.enrollment_status === 'pending' && (
            <button
              className="btn btn-light"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    'Cancel this unpaid reservation? Pending transactions must be reconciled first.',
                  )
                )
                  void act('cancel-enrollment', { id: user.enrollment_id });
              }}
            >
              Cancel unpaid reservation
            </button>
          )}
        </div>
      </div>
      <div className="card">
        <h2>Progress review</h2>
        <p className="tiny">
          Administrators can correct lesson completion. Every correction is audited.
        </p>
        {(data.lessons as Row[]).map((l) => (
          <label
            className="checkbox list-row"
            key={string(l, 'id')}
            style={{ justifyContent: 'start' }}
          >
            <input
              type="checkbox"
              checked={completed.has(l.id)}
              disabled={busy || user.enrollment_status !== 'active'}
              onChange={(event) =>
                void act(
                  'progress',
                  { userId: user.id, lessonId: l.id, completed: event.target.checked },
                  'Progress corrected.',
                )
              }
            />
            {string(l, 'title')}
          </label>
        ))}
      </div>
      <div className="card">
        <h2>Payment history</h2>
        <Table
          rows={data.payments as Row[]}
          columns={['reference', 'amount', 'status', 'provider_mode', 'paid_at']}
        />
      </div>
      {(data.submissions as Row[]).map((row) => (
        <form
          className="card"
          key={string(row, 'id')}
          onSubmit={(event) => {
            event.preventDefault();
            const v = formValues(event.currentTarget);
            void act(
              'feedback',
              { id: row.id, status: v.status, feedback: v.feedback },
              'Feedback saved.',
            );
          }}
        >
          <h2>{string(row, 'title')}</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{string(row, 'description')}</p>
          <div className="form-actions">
            {row.github_url ? (
              <a
                className="text-link"
                href={string(row, 'github_url')}
                target="_blank"
                rel="noreferrer"
              >
                Repository ↗
              </a>
            ) : null}
            {row.website_url ? (
              <a
                className="text-link"
                href={string(row, 'website_url')}
                target="_blank"
                rel="noreferrer"
              >
                Website ↗
              </a>
            ) : null}
          </div>
          <div className="form-grid" style={{ marginTop: 20 }}>
            <label className="field">
              <span>Review status</span>
              <select
                name="status"
                defaultValue={row.status === 'submitted' ? 'reviewed' : string(row, 'status')}
              >
                <option>reviewed</option>
                <option>needs_revision</option>
                <option>accepted</option>
              </select>
            </label>
            <label className="field full">
              <span>Instructor feedback</span>
              <textarea
                name="feedback"
                defaultValue={string(row, 'feedback')}
                required
                minLength={2}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn" disabled={busy}>
              Save feedback
            </button>
          </div>
        </form>
      ))}
    </div>
  );
}
function PrivacyCard({
  row,
  busy,
  act,
}: {
  row: Row;
  busy: boolean;
  act: (path: string, body: unknown, success?: string) => Promise<void>;
}) {
  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        const v = formValues(event.currentTarget);
        if (
          window.confirm(
            v.action === 'fulfill'
              ? 'Anonymize this account and remove personal learning data now? This cannot be undone.'
              : 'Decline this deletion request with the stated reason?',
          )
        )
          void act(
            'privacy-action',
            { id: row.id, action: v.action, notes: v.notes, confirm: true },
            'Privacy request updated.',
          );
      }}
    >
      <div className="toolbar">
        <h3>{string(row, 'name') || string(row, 'email')}</h3>
        <span className={'status ' + string(row, 'status')}>{string(row, 'status')}</span>
      </div>
      <p>
        {string(row, 'kind')} request · {string(row, 'email')} · {string(row, 'created_at')}
      </p>
      {row.status === 'pending' ? (
        <>
          <div className="notice">
            Before fulfillment, reconcile outstanding payments and assess required financial
            retention. Fulfillment revokes sessions, removes guardian/contact/learning data, and
            pseudonymizes retained financial records. Explain the decision to the learner through
            your support process.
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Decision</span>
              <select name="action">
                <option value="fulfill">Fulfill and anonymize account</option>
                <option value="decline">Decline with explanation</option>
              </select>
            </label>
            <label className="field full">
              <span>Decision notes / retention reason</span>
              <textarea name="notes" required minLength={10} maxLength={3000} />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-danger" disabled={busy}>
              Record decision
            </button>
          </div>
        </>
      ) : (
        <p>{string(row, 'notes')}</p>
      )}
    </form>
  );
}
