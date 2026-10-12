import { useEffect, useId, useState } from 'react';
import Button from '../base/Button';
import Icon from '../base/Icon';
import Input from '../base/Input';
import type { ChatApi } from './api';
import type { ChatLabels } from './labels';
import type { ChatRequest } from './types';

export default function ChatRequestPicker({
  api,
  value,
  onChange,
  disabled,
  labels: t,
}: {
  api: ChatApi;
  value: ChatRequest | null;
  onChange: (request: ChatRequest | null) => void;
  disabled?: boolean;
  labels: ChatLabels;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ChatRequest[]>([]);
  const [pages, setPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        let cursor: string | undefined;
        const rows: ChatRequest[] = [];
        for (let page = 0; page < pages; page++) {
          const data = await api.requests(
            query,
            cursor,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          rows.push(...data.items);
          cursor = data.nextCursor || undefined;
          if (!cursor) break;
        }
        setItems([
          ...new Map(
            rows.map((item) => [item.id, item]),
          ).values(),
        ]);
        setHasMore(!!cursor);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [api, open, query, pages, retry]);
  function choose(request: ChatRequest | null) {
    onChange(request);
    setOpen(false);
  }
  return (
    <div className="ui-chat-request-picker">
      <div className="ui-chat-section-label">
        <strong id={`${id}-label`}>{t.request}</strong>
      </div>
      <button
        type="button"
        className="ui-chat-request-value"
        disabled={disabled}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-expanded={open}
        aria-controls={`${id}-options`}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="Inbox" size={18} />
        <span id={`${id}-value`}>
          <strong>{value?.project || t.general}</strong>
          <small>{value?.client.name || t.noRequest}</small>
        </span>
        <span className="ui-chat-help">
          {value ? t.changeRequest : t.selectRequest}
        </span>
        <Icon name="ChevronDown" size={14} />
      </button>
      <p className="ui-chat-help">{t.requestHint}</p>
      {open && (
        <div
          id={`${id}-options`}
          className="ui-chat-request-options"
        >
          <Input
            icon="Search"
            aria-label={t.searchRequests}
            placeholder={t.searchRequests}
            value={query}
            maxLength={120}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setPages(1);
              setItems([]);
            }}
          />
          <div
            className="ui-chat-request-results"
            aria-busy={loading}
          >
            <button
              type="button"
              className="ui-chat-request-option"
              disabled={disabled}
              aria-pressed={!value}
              onClick={() => choose(null)}
            >
              <strong>{t.general}</strong>
              <small>{t.noRequest}</small>
            </button>
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                className="ui-chat-request-option"
                disabled={disabled}
                aria-pressed={value?.id === item.id}
                onClick={() => choose(item)}
              >
                <strong>{item.project}</strong>
                <small>{item.client.name}</small>
              </button>
            ))}
            {loading && (
              <p className="ui-chat-help" role="status">
                {t.loading}
              </p>
            )}
            {!loading && !error && !items.length && (
              <p className="ui-chat-help">{t.noRequests}</p>
            )}
            {error && (
              <div role="alert">
                <p className="ui-chat-help">{t.error}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setRetry((value) => value + 1)
                  }
                >
                  {t.retry}
                </Button>
              </div>
            )}
            {!loading && hasMore && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setPages((value) => value + 1)
                }
              >
                {t.more}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
