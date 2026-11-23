import { requireEnrollment } from './auth';
import { first, type AppEnv } from './db';
import { assert, HttpError } from './http';
import {
  isPowerPoint,
  POWERPOINT_TYPE,
  RESOURCE_FILE_LIMIT,
  RESOURCE_FILE_LIMIT_MB,
} from './resource-file';

const uploadLimit = RESOURCE_FILE_LIMIT + 128 * 1024;
const fileTooLarge = 'Choose a file that is ' + RESOURCE_FILE_LIMIT_MB + ' MB or smaller.';

export const visibleResource =
  'r.course_id=? AND (r.lesson_id IS NULL OR EXISTS(SELECT 1 FROM lessons l WHERE l.id=r.lesson_id AND l.published=1))';

export async function resourceUpload(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  const body = request.body;
  assert(body, 400, 'A resource form is required.');
  assert(Number(request.headers.get('content-length')) <= uploadLimit, 413, fileTooLarge);

  let length = 0;
  const stream = body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        length += chunk.byteLength;
        if (length > uploadLimit) {
          controller.error(new HttpError(413, fileTooLarge));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );
  try {
    const form = await new Response(stream, {
      headers: { 'Content-Type': contentType },
    }).formData();
    const file = form.get('file');
    const metadata = form.get('metadata');
    assert(file instanceof File && typeof metadata === 'string', 400, 'Choose a file to upload.');
    assert(metadata.length <= 65536, 413, 'Resource details are too large.');
    assert(file.size > 0, 400, 'The selected file is empty.');
    assert(file.size <= RESOURCE_FILE_LIMIT, 413, fileTooLarge);
    return { input: JSON.parse(metadata) as unknown, file };
  } catch (error) {
    if (length > uploadLimit) throw new HttpError(413, fileTooLarge);
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'The resource upload could not be read.');
  }
}

export async function storeResourceFile(e: AppEnv, file: File) {
  const name = file.name
    .replace(/[/\\\u0000-\u001f\u007f]/g, '_')
    .trim()
    .toWellFormed();
  assert(name && name.length <= 240, 400, 'Use a file name between 1 and 240 characters.');
  if (isPowerPoint(name)) {
    const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    assert(
      signature[0] === 0x50 && signature[1] === 0x4b && signature[2] === 3 && signature[3] === 4,
      400,
      'Choose a valid .pptx PowerPoint file.',
    );
  }
  const key = 'resources/' + crypto.randomUUID();
  assert(e.RESOURCE_FILES, 503, 'Resource file storage is unavailable.');
  await e.RESOURCE_FILES.put(key, file.stream());
  return { key, name };
}

export async function removeResourceFile(e: AppEnv, key: string | null | undefined) {
  if (!key) return;
  try {
    await e.RESOURCE_FILES.delete(key);
  } catch {
    console.error('Resource attachment cleanup failed', { key });
  }
}

export async function downloadResource(e: AppEnv, userId: string, id: string) {
  const enrollment = await requireEnrollment(e, userId);
  const row = await first<{ file_key: string; file_name: string }>(
    e,
    'SELECT r.file_key,r.file_name FROM resources r WHERE r.id=? AND r.file_key IS NOT NULL AND ' +
      visibleResource,
    id,
    enrollment.course_id,
  );
  assert(row, 404, 'Resource file not found.');
  assert(e.RESOURCE_FILES, 503, 'Resource file storage is unavailable.');
  const file = await e.RESOURCE_FILES.get(row.file_key);
  assert(file, 404, 'Resource file not found.');

  const name = encodeURIComponent(row.file_name).replace(
    /['()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
  return new Response(file.body, {
    headers: {
      'Content-Type': isPowerPoint(row.file_name) ? POWERPOINT_TYPE : 'application/octet-stream',
      'Content-Disposition': "attachment; filename*=UTF-8''" + name,
      'Content-Length': String(file.size),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
