'use client';
import { useState } from 'react';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { api, formValues } from './client-api';
import { Turnstile } from './turnstile';
export function LoginForm({
  siteKey,
  ready,
  next = '/portal',
}: {
  siteKey: string;
  ready: boolean;
  next?: string;
}) {
  const [email, setEmail] = useState(''),
    [stage, setStage] = useState<'email' | 'code'>('email'),
    [token, setToken] = useState(''),
    [nonce, setNonce] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function request(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('auth/request', { email, turnstileToken: token });
      setStage('code');
      setMessage('Check your inbox for an eight-digit code. It expires in 10 minutes.');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
      setToken('');
      setNonce((n) => n + 1);
    }
  }
  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const v = formValues(event.currentTarget);
      await api('auth/verify', { email, code: v.code });
      window.location.assign(next.startsWith('/') && !next.startsWith('//') ? next : '/portal');
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="card">
      <div className="feature-icon">
        <Mail size={22} />
      </div>
      <h2 style={{ marginTop: 23 }}>Your next chapter starts here.</h2>
      <p className="muted">
        Sign in or create an account with a one-time email code. For a learner under 18, a parent or
        guardian should use their own email.
      </p>
      {!ready && (
        <div className="notice">
          Email sign-in is being configured. Please check back before enrolling.
        </div>
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
      {stage === 'email' ? (
        <form onSubmit={request}>
          <label className="field">
            <span>Your email address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </label>
          <Turnstile siteKey={siteKey} action="login" onToken={setToken} nonce={nonce} />
          <div className="form-actions">
            <button className="btn" disabled={!ready || !token || busy}>
              {busy ? 'Sending code…' : 'Email me a sign-in code'}
              <ArrowRight size={15} />
            </button>
          </div>
          <p className="tiny">
            By continuing, you acknowledge our{' '}
            <a className="text-link" href="/policies/privacy">
              privacy policy
            </a>
            . No payment is taken at this step.
          </p>
        </form>
      ) : (
        <form onSubmit={verify}>
          <label className="field">
            <span>Eight-digit code for {email}</span>
            <input
              name="code"
              inputMode="numeric"
              pattern="[0-9]{8}"
              autoComplete="one-time-code"
              minLength={8}
              maxLength={8}
              required
              autoFocus
            />
          </label>
          <div className="form-actions">
            <button className="btn" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify & continue'}
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setStage('email');
                setMessage('');
                setNonce((n) => n + 1);
              }}
              disabled={busy}
            >
              Request a new code
            </button>
          </div>
        </form>
      )}
      <p className="tiny" style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 25 }}>
        <ShieldCheck size={14} /> Secure access. No permanent passwords.
      </p>
    </div>
  );
}
