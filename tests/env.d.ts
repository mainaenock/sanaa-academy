import '@cloudflare/vitest-plugin/types';
declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: import('cloudflare:test').D1Migration[];
    }
  }
}
