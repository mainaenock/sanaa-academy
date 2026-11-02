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
    if (process.argv.includes('--check-current-course')) {
      assert(body.includes('Your own website, at your own address'));
      assert(body.includes('The confidence to build another'));
      assert(body.includes('An understanding of how websites work'));
      const timetable = body.match(/<table class="learning-timetable">([\s\S]*?)<\/table>/)?.[1];
      assert(timetable, 'The curriculum must render as a table');
      for (const column of ['Week', 'Monday', 'Wednesday', 'Friday']) {
        assert(timetable.includes(`<th scope="col">${column}</th>`));
      }
      assert.equal((timetable.match(/<th scope="row">/g) ?? []).length, 5);
      assert.equal((timetable.match(/<td>/g) ?? []).length, 15);
      assert(body.includes('connect your chosen domain name'));
      assert(!body.includes('Tools and concepts'), 'Detailed lesson plans must stay private');
    }
    const css = body.match(/href="([^" ]+\.css)"/)?.[1];
    if (css) assert.equal((await fetch(new URL(css, origin))).status, 200);
  }
  if (path === '/api/public') {
    const data = JSON.parse(body);
    assert.equal(data.quote.currency, 'KES');
    assert(Number.isInteger(data.quote.amount) && data.quote.amount > 0);
    if (process.argv.includes('--check-current-course')) {
      assert.equal(data.quote.amount, 500000);
      assert.equal(data.quote.early, false);
      assert.equal(data.course.start_date, '2026-11-16');
      assert.equal(data.course.end_date, '2026-12-18');
      assert.equal(data.course.duration_weeks, 5);
      assert.equal(data.course.regular_price, 500000);
      assert.equal(data.course.early_price, 500000);
      assert(data.course.timetable.includes('Monday, Wednesday, and Friday'));
    }
  }
  results.push({ path, status: response.status });
}
console.log(JSON.stringify({ passed: results.length, results }, null, 2));
