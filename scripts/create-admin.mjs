import { execFileSync } from 'node:child_process';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const args = process.argv.slice(2),
  index = args.indexOf('--email'),
  email = args[index + 1]?.trim().toLowerCase();
if (
  index < 0 ||
  !email ||
  !/^\S+@\S+\.\S+$/.test(email) ||
  email.length > 254 ||
  email.endsWith('@deleted.invalid')
) {
  console.error('Usage: npm run admin:create -- --email YOUR_EMAIL [--remote]');
  process.exit(1);
}
const password = process.env.SANAA_ADMIN_PASSWORD;
if (!password || password.length < 10 || password.length > 128) {
  console.error(
    'Set SANAA_ADMIN_PASSWORD to a password between 10 and 128 characters before creating an administrator.',
  );
  process.exit(1);
}
const remote = args.includes('--remote'),
  q = (value) => "'" + value.replaceAll("'", "''") + "'",
  id = crypto.randomUUID(),
  salt = randomBytes(16),
  hash = pbkdf2Sync(password, salt, 210000, 32, 'sha256'),
  passwordHash = `pbkdf2$210000$${salt.toString('hex')}$${hash.toString('hex')}`;
const sql = `INSERT INTO users(id,email,role,password_hash) VALUES(${q(id)},${q(email)},'admin',${q(passwordHash)}) ON CONFLICT(email) DO UPDATE SET role='admin',password_hash=excluded.password_hash; INSERT INTO admin_audit_logs(id,actor_id,action,entity_type,entity_id) VALUES(${q(crypto.randomUUID())},'bootstrap-cli','grant_admin','users',${q(email)});`;
console.log(
  `Creating an administrator in the ${remote ? 'REMOTE' : 'LOCAL'} sanaa-academy database with password sign-in.`,
);
execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)),
    'd1',
    'execute',
    'sanaa-academy',
    remote ? '--remote' : '--local',
    '--command',
    sql,
  ],
  { stdio: 'inherit', env: process.env },
);
