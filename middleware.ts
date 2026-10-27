import { NextResponse, type NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  if (
    (request.method === 'GET' || request.method === 'HEAD') &&
    request.nextUrl.hostname.toLowerCase() === 'www.sanaacademy.co.ke'
  ) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = 'sanaacademy.co.ke';
    return NextResponse.redirect(canonicalUrl, 308);
  }

  const response = NextResponse.next(),
    path = request.nextUrl.pathname;
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com data:; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  if (request.nextUrl.protocol === 'https:')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (/^\/(admin|portal|login|register|payment|unsubscribe|api)(\/|$)/.test(path)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store');
  }
  return response;
}
export const config = { matcher: ['/((?!_next/static|favicon.ico).*)'] };
