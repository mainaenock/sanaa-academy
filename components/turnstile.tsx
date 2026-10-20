'use client';
import { useEffect, useRef } from 'react';
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}
export function Turnstile({
  siteKey,
  action,
  onToken,
  nonce = 0,
}: {
  siteKey: string;
  action: string;
  onToken: (token: string) => void;
  nonce?: number;
}) {
  const ref = useRef<HTMLDivElement>(null),
    callback = useRef(onToken);
  callback.current = onToken;
  useEffect(() => {
    if (!siteKey) return;
    let widget: string | undefined,
      alive = true;
    const render = () => {
      if (alive && ref.current && window.turnstile)
        widget = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          action,
          theme: 'light',
          callback: (token: string) => callback.current(token),
          'expired-callback': () => callback.current(''),
          'error-callback': () => callback.current(''),
        });
    };
    if (window.turnstile) render();
    else {
      let script = document.querySelector<HTMLScriptElement>('#turnstile-script');
      if (!script) {
        script = document.createElement('script');
        script.id = 'turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', render, { once: true });
    }
    return () => {
      alive = false;
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, [siteKey, action, nonce]);
  return siteKey ? (
    <div ref={ref} style={{ minHeight: 65, marginTop: 18 }} />
  ) : (
    <div className="notice">Security verification is awaiting configuration.</div>
  );
}
