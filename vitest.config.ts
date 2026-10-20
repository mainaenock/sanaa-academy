import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      main: './tests/worker.ts',
      miniflare: {
        compatibilityDate: '2026-10-17',
        compatibilityFlags: ['nodejs_compat'],
        d1Databases: ['DB'],
        bindings: {
          APP_URL: 'http://localhost:5173',
          APP_ENV: 'development',
          PAYSTACK_MODE: 'test',
          TURNSTILE_HOSTNAMES: 'localhost',
          TEST_MIGRATIONS: await readD1Migrations('./migrations'),
        },
      },
    })),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
