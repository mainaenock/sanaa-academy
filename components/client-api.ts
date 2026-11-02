'use client';
export async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
  csrf?: string,
  method?: string,
): Promise<T> {
  const response = await fetch('/api/' + path, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let result: T & { error?: unknown };
  try {
    result = (await response.json()) as T & { error?: unknown };
  } catch {
    throw new Error(
      response.status >= 500
        ? 'The service is temporarily unavailable. Please try again shortly.'
        : 'The server returned an unexpected response. Please refresh and try again.',
    );
  }
  if (!response.ok)
    throw new Error(
      typeof result?.error === 'string' ? result.error : 'The request could not be completed.',
    );
  return result;
}
export function formValues(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
}
