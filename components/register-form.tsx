'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { api, formValues } from './client-api';
import { Turnstile } from './turnstile';
import type { Course } from '@/lib/domain';
import { money } from '@/lib/format';
import type { User } from '@/lib/auth';
export function RegisterForm({
  user,
  csrf,
  siteKey,
  ready,
  available,
  initialQuote,
  course,
  existing,
  guardian,
}: {
  user: User | null;
  csrf: string;
  siteKey: string;
  ready: boolean;
  available: boolean;
  initialQuote: { amount: number; early: boolean; deadline: string };
  course: Course;
  existing: { id: string; status: string } | null;
  guardian: { name: string; email: string; phone: string; learner_email: string } | null;
}) {
  const [age, setAge] = useState(user?.age_category ?? 'adult'),
    [accountEmail, setAccountEmail] = useState(''),
    [learnerEmail, setLearnerEmail] = useState(''),
    [token, setToken] = useState(''),
    [nonce, setNonce] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [price, setPrice] = useState(initialQuote),
    [isAvailable, setAvailable] = useState(available);
  useEffect(() => {
    const refresh = () =>
      api<{ quote: typeof initialQuote; registrationAvailable: boolean }>('public')
        .then((r) => {
          setPrice(r.quote);
          setAvailable(r.registrationAvailable);
        })
        .catch(() => {});
    const delay = Math.max(0, new Date(initialQuote.deadline).getTime() - Date.now() + 100);
    const timer = initialQuote.early ? setTimeout(refresh, Math.min(delay, 2147483647)) : undefined;
    return () => clearTimeout(timer);
  }, [initialQuote]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const v = formValues(event.currentTarget);
    let requestCsrf = csrf;
    setBusy(true);
    setError('');
    try {
      if (!user) {
        const account = await api<{ csrf: string }>('auth/register', {
          email: v.accountEmail,
          password: v.password,
        });
        requestCsrf = account.csrf;
      }
      const result = await api<{ url: string }>(
        'enroll',
        {
          name: v.name,
          learnerEmail: v.learnerEmail,
          phone: v.phone,
          ageCategory: age,
          experience: v.experience,
          projectInterest: v.projectInterest,
          guardianName: v.guardianName ?? '',
          guardianEmail: user?.email ?? v.accountEmail ?? v.guardianEmail ?? '',
          guardianPhone: v.guardianPhone ?? '',
          guardianConsent: v.guardianConsent === 'on',
          terms: v.terms === 'on',
          updatesOptIn: v.updatesOptIn === 'on',
          turnstileToken: token,
          expectedAmount: price.amount,
        },
        requestCsrf,
      );
      window.location.assign(result.url);
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    } finally {
      setToken('');
      setNonce((n) => n + 1);
    }
  }
  async function resume() {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ url: string }>(
        'checkout/resume',
        { expectedAmount: price.amount },
        csrf,
      );
      window.location.assign(result.url);
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }
  if (existing?.status === 'active')
    return (
      <div className="card">
        <h2>You’re already on the journey.</h2>
        <p>Your enrollment is active. Your curriculum and class information are in your portal.</p>
        <a className="btn" href="/portal">
          Open student portal <ArrowUpRight size={16} />
        </a>
      </div>
    );
  if (existing && existing.status !== 'pending')
    return (
      <div className="notice">
        Your previous enrollment is {existing.status}. Contact the academy before registering again.
      </div>
    );
  return (
    <div className="stack">
      <div className="card">
        <div className="eyebrow">YOUR SIX-WEEK INVESTMENT</div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            gap: 20,
          }}
        >
          <h2 style={{ margin: 0 }}>{money(price.amount)}</h2>
          <span className="pill">
            {price.early
              ? 'Early bird · save ' +
                Math.round((1 - price.amount / course.regular_price) * 100) +
                '%'
              : 'Full program'}
          </span>
        </div>
        <p className="muted">
          {course.title} · {course.start_date} to {course.end_date} · {course.timezone}
        </p>
        <p className="tiny">
          The full program fee is charged once. AI subscriptions and optional domains are separate.{' '}
          {course.timetable}
        </p>
      </div>
      {!ready && (
        <div className="notice">
          Secure checkout is awaiting configuration. Payment cannot be taken yet.
        </div>
      )}
      {!isAvailable && <div className="notice">Registration is currently closed.</div>}
      {error && (
        <div role="alert" className="notice error">
          {error}
        </div>
      )}
      {existing?.status === 'pending' && (
        <div className="card">
          <h3>Welcome back. Your registration is saved.</h3>
          <p>You can resume your secure checkout, or update your details below first.</p>
          <div className="form-actions">
            <button className="btn" onClick={resume} disabled={!ready || busy || !isAvailable}>
              {busy ? 'Preparing checkout…' : 'Resume payment'}
            </button>
            <a className="text-link" href="/payment">
              Review payment status
            </a>
          </div>
        </div>
      )}
      <form className="card" onSubmit={submit}>
        <h2>Tell us a little about the learner.</h2>
        <p className="tiny">
          Your details are saved to your account. Portal access starts after Paystack confirms
          payment.
        </p>
        <div className="form-grid">
          {!user && (
            <>
              <label className="field">
                <span>Account email</span>
                <input
                  type="email"
                  name="accountEmail"
                  autoComplete="email"
                  value={accountEmail}
                  onChange={(e) => {
                    setAccountEmail(e.target.value);
                    if (age === 'adult') setLearnerEmail(e.target.value);
                  }}
                  required
                  maxLength={254}
                />
              </label>
              <label className="field">
                <span>Create password</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={128}
                  required
                />
                <small className="tiny">
                  Use at least 10 characters. You’ll use this to sign in anytime.
                </small>
              </label>
            </>
          )}
          <label className="field">
            <span>Learner’s full name</span>
            <input
              name="name"
              defaultValue={user?.name}
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label className="field">
            <span>Age category</span>
            <select value={age} onChange={(e) => setAge(e.target.value as 'adult' | 'minor')}>
              <option value="adult">18 or over</option>
              <option value="minor">Under 18</option>
            </select>
          </label>
          <label className="field">
            <span>Learner’s email</span>
            <input
              type="email"
              name="learnerEmail"
              {...(user
                ? { defaultValue: guardian?.learner_email ?? user.email }
                : { value: learnerEmail, onChange: (e) => setLearnerEmail(e.target.value) })}
              required
              maxLength={254}
            />
          </label>
          <label className="field">
            <span>Contact phone</span>
            <input
              type="tel"
              name="phone"
              defaultValue={user?.phone}
              required
              maxLength={22}
              autoComplete="tel"
            />
          </label>
          <label className="field full">
            <span>Prior experience (optional)</span>
            <input
              name="experience"
              defaultValue={user?.experience}
              maxLength={500}
              placeholder="New to all of this? You’re in the right place."
            />
          </label>
          <label className="field full">
            <span>Your website idea (optional)</span>
            <textarea
              name="projectInterest"
              defaultValue={user?.project_interest}
              maxLength={2000}
              placeholder="A business website, a portfolio, a community project…"
            />
          </label>
          {age === 'minor' && (
            <>
              <div className="notice full">
                A parent or guardian must complete this section. We collect no exact birth date. The
                guardian controls account access, consent, and payment.
              </div>
              <label className="field">
                <span>Parent / guardian name</span>
                <input
                  name="guardianName"
                  defaultValue={guardian?.name}
                  required
                  minLength={2}
                  maxLength={120}
                />
              </label>
              <label className="field">
                <span>Guardian email (verified account)</span>
                <input
                  name="guardianEmail"
                  type="email"
                  defaultValue={user?.email}
                  readOnly={!!user}
                  required
                />
              </label>
              <label className="field full">
                <span>Guardian phone</span>
                <input
                  name="guardianPhone"
                  type="tel"
                  defaultValue={guardian?.phone}
                  required
                  maxLength={22}
                />
              </label>
              <label className="checkbox full">
                <input name="guardianConsent" type="checkbox" required />I confirm I am this
                learner’s parent or legal guardian, I authorize their participation, and I consent
                to the necessary processing of their information under the privacy policy. I will
                supervise their use of third-party AI services and their applicable age
                requirements.
              </label>
            </>
          )}
          <label className="checkbox full">
            <input name="terms" type="checkbox" required />I accept the{' '}
            <a className="text-link" href="/policies/terms" target="_blank" rel="noreferrer">
              terms
            </a>
            ,{' '}
            <a className="text-link" href="/policies/privacy" target="_blank" rel="noreferrer">
              privacy policy
            </a>
            , and{' '}
            <a className="text-link" href="/policies/refunds" target="_blank" rel="noreferrer">
              refund policy
            </a>
            , and understand the full program fee is {money(price.amount)}.
          </label>
          <label className="checkbox full">
            <input name="updatesOptIn" type="checkbox" defaultChecked={!!user?.updates_opt_in} />
            Email me course announcements and schedule updates. I can opt out at any time. Account
            access and payment emails are still necessary to provide the service.
          </label>
        </div>
        <Turnstile siteKey={siteKey} action="register" onToken={setToken} nonce={nonce} />
        <div className="form-actions">
          <button className="btn" disabled={busy || !ready || !isAvailable || !token}>
            {busy ? 'Preparing your secure checkout…' : `Continue to pay ${money(price.amount)}`}
            <ArrowUpRight size={16} />
          </button>
        </div>
        <p className="tiny" style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <ShieldCheck size={14} /> Paystack handles your M-PESA or card details securely.
        </p>
      </form>
    </div>
  );
}
