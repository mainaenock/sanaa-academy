'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from './client-api';
import { money } from '@/lib/format';
type Payment = {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
};
export function PaymentStatus({
  payments,
  reference,
  csrf,
}: {
  payments: Payment[];
  reference?: string;
  csrf: string;
}) {
  const [selected, setSelected] = useState(reference ?? payments[0]?.reference ?? ''),
    [status, setStatus] = useState(
      payments.find((p) => p.reference === reference)?.status ?? payments[0]?.status ?? '',
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    started = useRef(false);
  const payment = payments.find((p) => p.reference === selected);
  async function verify(ref = selected) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api<{ status: string }>('payments/verify', { reference: ref }, csrf);
      setStatus(result.status);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (reference && !started.current && payments.some((p) => p.reference === reference)) {
      started.current = true;
      void verify(reference);
    }
  }, []);
  async function resend() {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ message: string }>('student/resend', {}, csrf);
      setMessage(r.message);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <article className="card">
        <div className="feature-icon">
          {status === 'success' ? <CheckCircle2 size={23} /> : <ShieldCheck size={23} />}
        </div>
        <h2 style={{ marginTop: 23 }}>
          {status === 'success'
            ? 'You’re in. Let’s build something.'
            : 'Your payment, clearly confirmed.'}
        </h2>
        <p className="muted">
          {status === 'success'
            ? 'Your payment is verified and your learning portal is ready. A welcome email is queued for your account.'
            : 'We confirm your payment directly with Paystack before activating enrollment. Returning from checkout alone does not confirm a payment.'}
        </p>
        {error && (
          <div role="alert" className="notice error">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="notice success">
            {message}
          </div>
        )}
        {payments.length ? (
          <>
            <label className="field">
              <span>Payment reference</span>
              <select
                value={selected}
                onChange={(event) => {
                  setSelected(event.target.value);
                  setStatus(payments.find((p) => p.reference === event.target.value)?.status ?? '');
                  setError('');
                }}
              >
                {payments.map((p) => (
                  <option key={p.reference} value={p.reference}>
                    {p.reference}
                  </option>
                ))}
              </select>
            </label>
            {payment && (
              <div className="notice">
                <strong>{money(payment.amount)}</strong> · {payment.currency}
                <br />
                Status:{' '}
                <span className={'status ' + status}>
                  {busy ? 'Checking…' : status || 'Unverified'}
                </span>
              </div>
            )}
            <div className="form-actions">
              {status === 'success' ? (
                <>
                  <a className="btn" href="/portal">
                    Enter student portal <ArrowUpRight size={15} />
                  </a>
                  <button className="btn btn-light" onClick={resend} disabled={busy}>
                    Resend welcome email
                  </button>
                </>
              ) : (
                <>
                  <button className="btn" onClick={() => void verify()} disabled={busy}>
                    <RefreshCw size={14} />
                    {busy ? 'Verifying with Paystack…' : 'Verify payment status'}
                  </button>
                  <a className="btn btn-light" href="/register">
                    Resume enrollment
                  </a>
                </>
              )}
            </div>
            {['failed', 'abandoned', 'refunded', 'reversed'].includes(status) && (
              <p className="tiny">
                {status === 'refunded' || status === 'reversed'
                  ? 'This payment no longer grants access. Contact the academy for assistance.'
                  : 'This attempt has not activated enrollment. You can retry from your saved registration.'}
              </p>
            )}
          </>
        ) : (
          <div className="empty">
            No payment attempts yet.{' '}
            <a className="text-link" href="/register">
              Start your registration ↗
            </a>
          </div>
        )}
      </article>
      <a className="text-link" href="/portal">
        Back to your account
      </a>
    </div>
  );
}
