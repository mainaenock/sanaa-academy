'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from './client-api';
import { money } from '@/lib/format';

export function PublicPaymentStatus({
  reference,
  amount,
  currency,
  initialStatus,
}: {
  reference: string;
  amount: number;
  currency: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');

  async function verify() {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ status: string }>('payments/verify-public', { reference });
      setStatus(result.status);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialStatus !== 'success') void verify();
  }, []);

  return (
    <article className="card stack">
      <div className="feature-icon">
        {status === 'success' ? <CheckCircle2 size={23} /> : <ShieldCheck size={23} />}
      </div>
      <h2 style={{ marginTop: 8 }}>
        {status === 'success' ? 'Payment confirmed' : 'Confirming your payment'}
      </h2>
      <p className="muted">
        {status === 'success'
          ? 'Your account is ready. Sign in with the email and password you chose during registration.'
          : 'We check your payment directly with Paystack. M-PESA payments can take a little time to confirm.'}
      </p>
      {error && <div role="alert" className="notice error">{error}</div>}
      <div className="notice">
        <strong>{money(amount)}</strong> · {currency}
        <br />
        Reference: {reference}
        <br />
        Status: <span className={'status ' + status}>{busy ? 'Checking…' : status}</span>
      </div>
      <div className="form-actions">
        {status === 'success' ? (
          <a className="btn" href="/login">
            Sign in <ArrowUpRight size={15} />
          </a>
        ) : (
          <button className="btn" onClick={() => void verify()} disabled={busy}>
            <RefreshCw size={14} />
            {busy ? 'Verifying with Paystack…' : 'Check payment status'}
          </button>
        )}
      </div>
      {['failed', 'abandoned', 'reversed', 'refunded'].includes(status) && (
        <p className="tiny">This attempt did not activate an account. Contact the academy if you believe you paid.</p>
      )}
    </article>
  );
}
