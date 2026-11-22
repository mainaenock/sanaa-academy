'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api, formValues } from './client-api';

export function StudentActivationForm() {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setToken(window.location.hash.slice(1));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { email, password, confirmPassword } = formValues(event.currentTarget);
    if (password !== confirmPassword) {
      setError('Enter the same password in both fields.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api('auth/activate-student', { email, password, token });
      window.history.replaceState(null, '', '/activate');
      window.location.replace('/portal');
    } catch (error) {
      setError((error as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h1>Set up your student portal</h1>
      {token === null ? (
        <p role="status">Loading your setup link…</p>
      ) : !/^[a-f0-9]{64}$/.test(token) ? (
        <p>Open the full setup link from your administrator.</p>
      ) : (
        <>
          <p className="muted">Use the email you enrolled with and choose a password.</p>
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            <label className="field">
              <span>Enrollment email</span>
              <input type="email" name="email" autoComplete="username" maxLength={254} required />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
              />
              <small>Use at least 10 characters.</small>
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                required
              />
            </label>
            <div className="form-actions">
              <button className="btn" disabled={busy}>
                {busy ? 'Setting up your portal…' : 'Set password and open portal'}
              </button>
            </div>
          </form>
        </>
      )}
      <p className="tiny">
        Already have a password?{' '}
        <a className="text-link" href="/login">
          Sign in
        </a>
        .
      </p>
    </div>
  );
}
