import { execFileSync } from 'node:child_process';
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
const remote = args.includes('--remote'),
  q = (value) => "'" + value.replaceAll("'", "''") + "'",
  id = crypto.randomUUID();
const sql = `INSERT OR IGNORE INTO users(id,email,role) VALUES(${q(id)},${q(email)},'admin'); UPDATE users SET role='admin' WHERE email=${q(email)}; INSERT INTO admin_audit_logs(id,actor_id,action,entity_type,entity_id) VALUES(${q(crypto.randomUUID())},'bootstrap-cli','grant_admin','users',${q(email)});`;
console.log(
  `Creating an administrator in the ${remote ? 'REMOTE' : 'LOCAL'} sanaa-academy database. No password is created; sign in by email verification.`,
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
