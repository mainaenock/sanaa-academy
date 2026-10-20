'use client';
import { useState } from 'react';
import { api } from './client-api';
export function UnsubscribeForm({ token }: { token: string }) {
  const [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <div className="card">
      <h1 style={{ fontWeight: 700, fontSize: 25 }}>Your inbox, your choice.</h1>
      <p>
        Stop course announcement emails. Essential sign-in and payment messages will still be sent
        when needed.
      </p>
      {message ? (
        <div className="notice success" role="status">
          {message}
        </div>
      ) : (
        <button
          className="btn"
          disabled={busy || !token}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              const r = await api<{ message: string }>('unsubscribe', { token });
              setMessage(r.message);
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Updating…' : 'Unsubscribe from course updates'}
        </button>
      )}
      {error && (
        <div role="alert" className="notice error">
          {error}
        </div>
      )}
      <p>
        <a className="text-link" href="/portal/profile">
          Manage profile preferences
        </a>
      </p>
    </div>
  );
}
