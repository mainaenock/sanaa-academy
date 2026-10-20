import { handleApi } from '../lib/api';
import type { AppEnv } from '../lib/db';
export default {
  fetch(request: Request, env: AppEnv) {
    return handleApi(request, env);
  },
};
