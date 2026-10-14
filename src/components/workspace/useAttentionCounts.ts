import { useEffect, useState } from 'react';

export type AttentionKey =
  | 'notifications'
  | 'chat'
  | 'applications'
  | 'contact'
  | 'clientAccess'
  | 'offers'
  | 'bookings';
export type AttentionCounts = Partial<
  Record<AttentionKey, number>
>;
export type WorkspaceAttention = {
  apiBaseUrl: string;
  /** Include the account and role so switching accounts clears old counts. */
  identity: string;
  /** Refresh after workspace mutations settle. */
  refreshKey?: number;
};

export default function useAttentionCounts(
  attention: WorkspaceAttention | undefined,
  navigationKey: string,
) {
  const url = attention?.apiBaseUrl.replace(/\/$/, '');
  const identity = attention?.identity;
  const refreshKey = attention?.refreshKey;
  const key = `${url}:${identity}`;
  const [snapshot, setSnapshot] = useState<{
    key: string;
    counts: AttentionCounts;
  }>();

  useEffect(() => {
    if (!url || !identity) return;
    const controller = new AbortController();
    let running = false;
    let queued = false;
    async function load() {
      if (document.hidden || controller.signal.aborted)
        return;
      if (running) {
        queued = true;
        return;
      }
      running = true;
      try {
        const response = await fetch(
          `${url}/workspace/attention`,
          {
            credentials: 'include',
            cache: 'no-store',
            signal: controller.signal,
          },
        );
        if (!response.ok)
          throw new Error('Counts unavailable');
        const counts: AttentionCounts =
          await response.json();
        if (!controller.signal.aborted)
          setSnapshot({ key, counts });
      } catch {
        if (!controller.signal.aborted)
          setSnapshot({ key, counts: {} });
      } finally {
        running = false;
        if (queued) {
          queued = false;
          void load();
        }
      }
    }
    const refresh = () => void load();
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    window.addEventListener(
      'itsyou:notifications-changed',
      refresh,
    );
    window.addEventListener(
      'itsyou:attention-changed',
      refresh,
    );
    document.addEventListener('visibilitychange', refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(
        'itsyou:notifications-changed',
        refresh,
      );
      window.removeEventListener(
        'itsyou:attention-changed',
        refresh,
      );
      document.removeEventListener(
        'visibilitychange',
        refresh,
      );
    };
  }, [url, identity, key, navigationKey, refreshKey]);

  return identity && snapshot?.key === key
    ? snapshot.counts
    : {};
}
