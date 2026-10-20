import { readFileSync } from 'node:fs';
import ts from 'typescript';
const parsed = ts.parseConfigFileTextToJson(
  'wrangler.jsonc',
  readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
);
if (parsed.error)
  throw new Error(
    'Cannot parse wrangler.jsonc. Correct the source configuration before deployment.',
  );
const config = parsed.config;
const errors = [];
if (config.d1_databases?.[0]?.database_id === '00000000-0000-0000-0000-000000000000')
  errors.push('Replace the local placeholder D1 ID with your real database ID.');
if (config.vars?.APP_ENV !== 'production')
  errors.push('Set APP_ENV to production in wrangler.jsonc.');
if (config.vars?.PAYSTACK_MODE !== 'live')
  errors.push(
    'Set PAYSTACK_MODE to live for production. Use a separate staging Worker for Paystack testing.',
  );
try {
  const url = new URL(config.vars?.APP_URL);
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname))
    throw new Error();
  if (
    !config.vars?.TURNSTILE_HOSTNAMES?.split(',')
      .map((s) => s.trim())
      .includes(url.hostname)
  )
    errors.push('TURNSTILE_HOSTNAMES must include the public APP_URL hostname.');
} catch {
  errors.push('Set APP_URL to your real https:// origin.');
}
if (/localhost|127\.0\.0\.1/.test(config.vars?.TURNSTILE_HOSTNAMES ?? ''))
  errors.push('Remove local hostnames from production Turnstile settings.');
if (errors.length) {
  console.error(
    'Production configuration is incomplete:\n' + errors.map((e) => ' - ' + e).join('\n'),
  );
  process.exit(1);
}
console.log(
  'Production source configuration passed. Confirm remote migrations, provider secrets, test-payment acceptance, verified email sender, policies and administrator setup before release.',
);
