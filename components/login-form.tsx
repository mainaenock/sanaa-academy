'use client';
import { useState } from 'react';
import { ArrowRight, KeyRound } from 'lucide-react';
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
  const [token, setToken] = useState(''),
    [nonce, setNonce] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const v = formValues(event.currentTarget);
    try {
      await api('auth/login', { email: v.email, password: v.password, turnstileToken: token });
      window.location.assign(next.startsWith('/') && !next.startsWith('//') ? next : '/portal');
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
      setToken('');
      setNonce((n) => n + 1);
    }
  }
  return (
    <div className="card">
      <div className="feature-icon">
        <KeyRound size={22} />
      </div>
      <h2 style={{ marginTop: 23 }}>Welcome back.</h2>
      <p className="muted">Sign in with the email and password you chose when registering.</p>
      {!ready && (
        <div className="notice">Secure sign-in is being configured. Please try again later.</div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={submit}>
        <label className="field">
          <span>Email address</span>
          <input type="email" name="email" autoComplete="email" required maxLength={254} />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            minLength={10}
            maxLength={128}
            required
          />
        </label>
        <Turnstile siteKey={siteKey} action="login" onToken={setToken} nonce={nonce} />
        <div className="form-actions">
          <button className="btn" disabled={!ready || !token || busy}>
            {busy ? 'Signing in…' : 'Sign in'}
            <ArrowRight size={15} />
          </button>
        </div>
        <p className="tiny">
          New to Sanaa Academy?{' '}
          <a className="text-link" href="/register">
            Create an account and enroll
          </a>
          .
        </p>
      </form>
    </div>
  );
}
