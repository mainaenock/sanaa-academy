import assert from 'node:assert/strict';
const origin = process.argv[2] ?? 'http://127.0.0.1:8787';
const results = [];
for (const path of [
  '/',
  '/faq',
  '/register',
  '/policies/privacy',
  '/robots.txt',
  '/sitemap.xml',
  '/api/public',
  '/api/student',
  '/api/admin/students',
  '/portal',
  '/admin',
  '/payment',
  '/this-page-does-not-exist',
]) {
  const response = await fetch(new URL(path, origin), {
    redirect: 'manual',
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.text();
  if (['/portal', '/admin', '/payment'].includes(path)) {
    assert(
      response.status >= 300 && response.status < 400,
      `${path} must redirect anonymous users`,
    );
    assert(response.headers.get('location')?.includes('/login'));
  } else if (path === '/api/student' || path === '/api/admin/students')
    assert.equal(response.status, 401, `${path} must require authentication`);
  else if (path === '/this-page-does-not-exist') assert.equal(response.status, 404);
  else assert.equal(response.status, 200, `${path} failed`);
  if (path === '/robots.txt') assert(body.includes('/portal') && body.includes('/admin'));
  if (path === '/sitemap.xml') assert(body.includes('<urlset'));
  if (path.startsWith('/api/') || ['/portal', '/admin', '/payment', '/register'].includes(path)) {
    assert(
      response.headers.get('cache-control')?.includes('no-store'),
      `${path} must not be cached`,
    );
    assert(
      response.headers.get('x-robots-tag')?.includes('noindex'),
      `${path} must not be indexed`,
    );
  }
  if (path === '/') {
    assert(body.includes('Sanaa Academy'));
    assert(
      body.includes('learning-hero'),
      'Homepage must render the actual course, not the setup error boundary',
    );
    assert(response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
    const css = body.match(/href="([^" ]+\.css)"/)?.[1];
    if (css) assert.equal((await fetch(new URL(css, origin))).status, 200);
  }
  if (path === '/api/public') {
    const data = JSON.parse(body);
    assert.equal(data.quote.currency, 'KES');
    assert(Number.isInteger(data.quote.amount) && data.quote.amount > 0);
  }
  results.push({ path, status: response.status });
}
console.log(JSON.stringify({ passed: results.length, results }, null, 2));
