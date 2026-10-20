import { handleApi } from '@/lib/api';
import { runtime } from '@/lib/db';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handleApi(request, runtime());
export const POST = GET;
export const DELETE = GET;
