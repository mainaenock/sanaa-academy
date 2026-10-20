'use client';
import { useEffect, useState } from 'react';
export function Countdown({
  deadline,
  variant = 'inline',
}: {
  deadline: string;
  variant?: 'inline' | 'tiles';
}) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(deadline).getTime() - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  if (variant === 'tiles') {
    if (left === 0)
      return (
        <div className="learning-timer-ended">
          Early-bird registration has ended. <a href="/register">See current price</a>
        </div>
      );
    const values =
      left === null
        ? ['—', '—', '—', '—']
        : [
            Math.floor(left / 86400000),
            Math.floor(left / 3600000) % 24,
            Math.floor(left / 60000) % 60,
            Math.floor(left / 1000) % 60,
          ];
    return (
      <div className="learning-timer">
        <span className="learning-label">EARLY-BIRD OFFER CLOSES IN</span>
        <div
          className="learning-timer-grid"
          role="timer"
          aria-label="Time remaining for early-bird registration"
          aria-live="off"
        >
          {['Days', 'Hours', 'Mins', 'Secs'].map((label, i) => (
            <div key={label}>
              <strong>
                {typeof values[i] === 'number' ? String(values[i]).padStart(2, '0') : values[i]}
              </strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (left === 0)
    return (
      <div className="countdown">
        Early-bird registration has ended.{' '}
        <a className="text-link" href="/register">
          See current price
        </a>
      </div>
    );
  if (left === null)
    return (
      <div className="countdown">
        Early bird ends {new Date(deadline).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })}{' '}
        EAT
      </div>
    );
  return (
    <div className="countdown">
      <span>Early bird closes in</span>
      <strong>
        {Math.floor(left / 86400000)}d {Math.floor(left / 3600000) % 24}h{' '}
        {Math.floor(left / 60000) % 60}m {Math.floor(left / 1000) % 60}s
      </strong>
    </div>
  );
}
