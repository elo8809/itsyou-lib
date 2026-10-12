import { useCallback, useEffect, useState } from 'react';

export type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  resolved: boolean;
  href: string;
  pitchId?: string | null;
};
type Feed = {
  items: NotificationItem[];
  unreadCount: number;
  openCount: number;
  nextCursor: string | null;
  asOf: string;
};
const changed = 'itsyou:notifications-changed';

async function request<T>(
  url: string,
  signal?: AbortSignal,
  body?: object,
): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    signal,
    ...(body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  if (!response.ok)
    throw new Error('Notification request failed');
  return response.json();
}

export default function useNotificationFeed(
  url: string,
  identity: string,
  filter: string,
) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState(1);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(
    () => setRevision((value) => value + 1),
    [],
  );
  useEffect(() => {
    setFeed(null);
    setPages(1);
    setError(false);
    setActionError(false);
  }, [url, identity]);
  useEffect(() => {
    setPages(1);
    setError(false);
  }, [filter]);
  useEffect(() => {
    if (!identity) return;
    const abort = new AbortController();
    let fetching = false;
    async function load() {
      if (fetching) return;
      fetching = true;
      setLoading(true);
      try {
        let combined: Feed | null = null;
        for (let page = 0; page < pages; page++) {
          const cursor: string | null =
            combined?.nextCursor || null;
          const result: Feed = await request(
            `${url}?filter=${filter}${cursor ? `&cursor=${cursor}` : ''}`,
            abort.signal,
          );
          combined = combined
            ? {
                ...combined,
                items: [...combined.items, ...result.items],
                nextCursor: result.nextCursor,
              }
            : result;
          if (!result.nextCursor) break;
        }
        if (!abort.signal.aborted) {
          setFeed(combined);
          setError(false);
        }
      } catch {
        if (!abort.signal.aborted) setError(true);
      } finally {
        fetching = false;
        if (!abort.signal.aborted) setLoading(false);
      }
    }
    void load();
    const onChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail === url)
        refresh();
    };
    const onFocus = () => {
      if (!document.hidden) void load();
    };
    const interval = setInterval(onFocus, 30_000);
    window.addEventListener(changed, onChange);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      abort.abort();
      clearInterval(interval);
      window.removeEventListener(changed, onChange);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener(
        'visibilitychange',
        onFocus,
      );
    };
  }, [url, identity, filter, pages, revision, refresh]);

  const act = async (
    operation: 'read' | 'resolve',
    target: { id: string } | { before: string },
  ) => {
    if (busy) return;
    setBusy('id' in target ? target.id : 'all');
    setActionError(false);
    try {
      await request(
        `${url}/${operation}`,
        undefined,
        target,
      );
      window.dispatchEvent(
        new CustomEvent(changed, { detail: url }),
      );
    } catch {
      setActionError(true);
    } finally {
      setBusy(null);
    }
  };
  return {
    feed,
    error,
    actionError,
    busy,
    loading,
    refresh,
    more: () => setPages((value) => value + 1),
    act,
  };
}
