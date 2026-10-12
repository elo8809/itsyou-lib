import { useEffect, useState } from 'react';
export const requestFileUrl = (
  apiBaseUrl: string,
  path: string,
) =>
  `${apiBaseUrl.replace(/\/$/, '')}/request-files/${path}`;
export async function fileRequest<T>(
  url: string,
  body?: FormData | Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const form = body instanceof FormData;
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    signal,
    method: body ? 'POST' : 'GET',
    ...(body
      ? {
          headers: form
            ? { 'X-Requested-With': 'XMLHttpRequest' }
            : { 'Content-Type': 'application/json' },
          body: form ? body : JSON.stringify(body),
        }
      : {}),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.message ||
        'Die Dateien konnten nicht geladen werden. Bitte versuchen Sie es erneut.',
    );
  }
  return response.json();
}
export function useRequestFiles<T>(
  url: string,
  active: boolean,
) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    setData(null);
    setError('');
  }, [url]);
  useEffect(() => {
    if (!active) return;
    const abort = new AbortController();
    let loading = false;
    async function load() {
      if (loading) return;
      loading = true;
      try {
        const next = await fileRequest<T[]>(
          url,
          undefined,
          abort.signal,
        );
        if (!abort.signal.aborted) {
          setData(next);
          setError('');
        }
      } catch (error) {
        if (!abort.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : 'Bitte erneut versuchen.',
          );
      } finally {
        loading = false;
      }
    }
    void load();
    const interval = setInterval(() => {
      if (!document.hidden) void load();
    }, 30000);
    return () => {
      abort.abort();
      clearInterval(interval);
    };
  }, [url, active, revision]);
  return {
    data,
    error,
    refresh: () => setRevision((value) => value + 1),
  };
}
export function fileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toLocaleString('de-DE', { maximumFractionDigits: 1 })} MB`;
}
