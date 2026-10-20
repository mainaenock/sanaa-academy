const encoder = new TextEncoder();
export function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
export async function digest(value: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
export async function verifyWebhook(raw: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{128}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['verify'],
  );
  const bytes = new Uint8Array(signature.match(/../g)!.map((s) => parseInt(s, 16)));
  return crypto.subtle.verify('HMAC', key, bytes, encoder.encode(raw));
}
