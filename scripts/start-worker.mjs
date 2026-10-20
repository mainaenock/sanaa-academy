import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// Keep the built preview on the same D1 store as `db:migrate` and Vite development.
const previewArgs = process.argv.slice(2);
if (!previewArgs.includes('--port') && !previewArgs.some((arg) => arg.startsWith('--port=')))
  previewArgs.push('--port', '5173');
const worker = spawn(
  process.execPath,
  [
    fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)),
    'dev',
    '--config',
    fileURLToPath(new URL('../dist/server/wrangler.json', import.meta.url)),
    '--persist-to',
    fileURLToPath(new URL('../.wrangler/state', import.meta.url)),
    ...previewArgs,
  ],
  { stdio: 'inherit', env: process.env, windowsHide: true },
);
worker.on('exit', (code) => process.exit(code ?? 1));
worker.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => worker.kill(signal));
