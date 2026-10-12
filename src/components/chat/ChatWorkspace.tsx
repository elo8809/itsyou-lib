import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Button from '../base/Button';
import Icon from '../base/Icon';
import Input from '../base/Input';
import PageHeader from '../workspace/PageHeader';
import {
  EmptyState,
  InlineNotice,
} from '../workspace/Feedback';
import { ChatApiError, createChatApi } from './api';
import type {
  ChatDetail,
  ChatLocale,
  ChatGrouping,
  ChatMessage,
  ChatSummary,
  ChatViewer,
} from './types';
import { chatLabels } from './labels';
import ChatGroupDialog from './ChatGroupDialog';
import ChatThread from './ChatThread';
import ChatConversationList from './ChatConversationList';

/** Shared messaging feature. The API remains the authority for all permissions. */
export default function ChatWorkspace({
  apiBaseUrl,
  locale = 'en',
  allowManagement = false,
  grouping = 'none',
  clientRequestId,
  embedded = false,
  selectedChatId,
  onSelectChat,
}: {
  apiBaseUrl: string;
  locale?: ChatLocale;
  allowManagement?: boolean;
  grouping?: ChatGrouping;
  clientRequestId?: string;
  embedded?: boolean;
  selectedChatId?: string;
  onSelectChat?: (id: string | undefined) => void;
}) {
  const api = useMemo(
    () => createChatApi(apiBaseUrl),
    [apiBaseUrl],
  );
  const t = chatLabels[locale];
  const [viewer, setViewer] = useState<ChatViewer | null>(
    null,
  );
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [archived, setArchived] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<
    string | undefined
  >(selectedChatId);
  const initialSelection = useRef(false);
  const [editor, setEditor] = useState<
    ChatDetail | 'new' | null
  >(null);
  const [refresh, setRefresh] = useState(0);
  const [drafts, setDrafts] = useState<
    Record<string, string>
  >({});
  const canManage = allowManagement && !!viewer?.canManage;
  const [sendingIds, setSendingIds] = useState<
    Record<string, boolean>
  >({});
  const outbox = useRef(
    new Map<
      string,
      {
        body: string;
        key: string;
        promise?: Promise<ChatMessage>;
      }
    >(),
  );
  useEffect(() => {
    setSelected(selectedChatId);
  }, [selectedChatId]);
  const updateDraft = useCallback(
    (id: string, text: string) =>
      setDrafts((current) => ({ ...current, [id]: text })),
    [],
  );
  const refreshChats = useCallback(
    () => setRefresh((n) => n + 1),
    [],
  );
  // Preserve retry keys and in-flight sends when navigating between chats.
  const sendDraft = useCallback(
    (id: string, body: string) => {
      const previous = outbox.current.get(id);
      if (previous?.promise) return previous.promise;
      const entry =
        previous?.body === body
          ? previous
          : {
              body,
              key: crypto.randomUUID(),
              promise: undefined as
                | Promise<ChatMessage>
                | undefined,
            };
      outbox.current.set(id, entry);
      setSendingIds((current) => ({
        ...current,
        [id]: true,
      }));
      entry.promise = api
        .send(id, body, entry.key)
        .then((message) => {
          setDrafts((current) =>
            current[id]?.trim() === body
              ? { ...current, [id]: '' }
              : current,
          );
          outbox.current.delete(id);
          refreshChats();
          return message;
        })
        .finally(() => {
          entry.promise = undefined;
          setSendingIds((current) => ({
            ...current,
            [id]: false,
          }));
        });
      return entry.promise;
    },
    [api, refreshChats],
  );
  const readChat = useCallback(
    (id: string, sequence: number) => {
      setChats((current) =>
        current.map((chat) =>
          chat.id === id
            ? {
                ...chat,
                lastReadSequence: Math.max(
                  sequence,
                  chat.lastReadSequence,
                ),
                unreadCount: Math.max(
                  0,
                  chat.messageSequence -
                    Math.max(
                      sequence,
                      chat.lastReadSequence,
                    ),
                ),
              }
            : chat,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    async function load() {
      if (running || document.hidden) return;
      running = true;
      try {
        let cursor: string | undefined;
        const rows: ChatSummary[] = [];
        for (let page = 0; page < pages; page++) {
          const data = await api.list(
            search,
            cursor,
            controller.signal,
            clientRequestId,
            archived,
          );
          if (controller.signal.aborted) return;
          setViewer(data.viewer);
          setArchivedCount(data.archivedCount || 0);
          if (
            page === 0 &&
            data.generalChat &&
            !clientRequestId &&
            !embedded
          ) {
            const query = search.trim().toLocaleLowerCase();
            if (
              !query ||
              `${t.generalChat} ${t.agencyTeam}`
                .toLocaleLowerCase()
                .includes(query)
            )
              rows.push(data.generalChat);
            if (!initialSelection.current && !archived) {
              initialSelection.current = true;
              setSelected(
                (current) =>
                  current || data.generalChat!.id,
              );
            }
          }
          rows.push(...data.items);
          cursor = data.nextCursor || undefined;
          if (!cursor) break;
        }
        setChats([
          ...new Map(
            rows.map((row) => [row.id, row]),
          ).values(),
        ]);
        if (embedded) {
          setSelected((current) => {
            if (!initialSelection.current && rows.length) {
              initialSelection.current = true;
              return rows[0].id;
            }
            // Never keep an embedded thread after removal or reassignment.
            return current &&
              !rows.some((row) => row.id === current)
              ? undefined
              : current;
          });
        }
        setHasMore(!!cursor);
        setError(false);
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(true);
          if (
            e instanceof ChatApiError &&
            [401, 403].includes(e.status)
          ) {
            setChats([]);
            setViewer(null);
            setEditor(null);
          }
        }
      } finally {
        running = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    const debounce = setTimeout(() => void load(), 200);
    const timer = setInterval(() => void load(), 8000);
    const wake = () => void load();
    window.addEventListener('focus', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      controller.abort();
      clearTimeout(debounce);
      clearInterval(timer);
      window.removeEventListener('focus', wake);
      document.removeEventListener(
        'visibilitychange',
        wake,
      );
    };
  }, [
    api,
    search,
    pages,
    refresh,
    clientRequestId,
    embedded,
    t,
    archived,
  ]);
  function select(id?: string) {
    setSelected(id);
    onSelectChat?.(id);
  }
  function changeView(
    archiveView: boolean,
    unread = false,
  ) {
    setArchived(archiveView);
    setUnreadOnly(unread);
    setPages(1);
    if (archiveView !== archived) {
      setChats([]);
      setLoading(true);
      select(undefined);
    }
  }
  const visibleChats = chats.filter(
    (chat) =>
      !unreadOnly ||
      chat.unreadCount > 0 ||
      chat.id === selected,
  );
  const unreadCount = chats.reduce(
    (sum, chat) => sum + chat.unreadCount,
    0,
  );
  const activeChat =
    embedded && !chats.some((chat) => chat.id === selected)
      ? undefined
      : selected;
  if (
    embedded &&
    !loading &&
    !error &&
    !chats.length &&
    !search &&
    !archived &&
    !archivedCount
  )
    return (
      <section
        className="ui-request-chat-empty"
        aria-label="Chat"
      >
        <h2>Chat</h2>
        <EmptyState
          icon="Chat"
          title={t.noRequestChats}
          description={t.noRequestChatsHint}
        />
      </section>
    );
  return (
    <div
      className="ui-chat-workspace"
      data-manage={canManage}
      data-embedded={embedded}
    >
      {embedded ? (
        <div className="ui-request-chat-heading">
          <h2>Chat</h2>
          <p>{t.requestChatHint}</p>
        </div>
      ) : (
        <PageHeader
          eyebrow={
            locale === 'de' ? 'NACHRICHTEN' : 'MESSAGES'
          }
          title="Chat"
          subtitle={t.subtitle}
          actions={
            canManage && (
              <Button
                icon="Plus"
                onClick={() => setEditor('new')}
              >
                {t.newChat}
              </Button>
            )
          }
        />
      )}
      <div
        className="ui-chat"
        data-selected={!!activeChat && !!viewer}
      >
        <aside
          className="ui-chat-sidebar"
          aria-label={t.chats}
        >
          <div className="ui-chat-sidebar-heading">
            <h2>{t.chats}</h2>
            {unreadCount > 0 && (
              <span className="ui-chat-count">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="ui-chat-search">
            <Input
              icon="Search"
              placeholder={t.search}
              aria-label={t.search}
              maxLength={120}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPages(1);
                setLoading(true);
              }}
            />
          </div>
          <div
            className="ui-chat-filters"
            role="group"
            aria-label={t.chats}
          >
            <button
              type="button"
              aria-pressed={!unreadOnly && !archived}
              onClick={() => changeView(false)}
            >
              {t.all}
            </button>
            <button
              type="button"
              aria-pressed={unreadOnly && !archived}
              onClick={() => changeView(false, true)}
            >
              {t.unread}
            </button>
            <button
              type="button"
              aria-pressed={archived}
              onClick={() => changeView(true)}
            >
              {t.archived}
              {archivedCount > 0
                ? ` (${archivedCount})`
                : ''}
            </button>
          </div>
          {error && (
            <InlineNotice
              tone="error"
              action={
                <button
                  type="button"
                  onClick={refreshChats}
                >
                  {t.retry}
                </button>
              }
            >
              {t.error}
            </InlineNotice>
          )}
          <div className="ui-chat-list" aria-busy={loading}>
            {loading && !chats.length ? (
              <EmptyState
                loading
                loadingLabel={t.loading}
              />
            ) : (
              <>
                <ChatConversationList
                  chats={visibleChats}
                  grouping={grouping}
                  selected={selected}
                  onSelect={select}
                  locale={locale}
                  labels={t}
                  search={search}
                />
                {!visibleChats.length && !error && (
                  <EmptyState
                    icon="Chat"
                    title={
                      archived && !search
                        ? t.noArchived
                        : search || unreadOnly
                          ? t.noResults
                          : t.noChats
                    }
                    description={
                      archived && !search
                        ? t.noArchivedHint
                        : search || unreadOnly
                          ? t.noResultsHint
                          : canManage
                            ? t.noChatsAdmin
                            : t.noChatsHint
                    }
                  />
                )}
                {hasMore && (
                  <div className="ui-chat-load-older">
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={loading}
                      onClick={() => {
                        setPages((n) => n + 1);
                        setLoading(true);
                      }}
                    >
                      {t.more}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="ui-chat-sidebar-footer">
            <Icon name="UsersCheck" size={15} />
            <span>IT’S YOU AGENCY</span>
          </div>
        </aside>
        {activeChat && viewer ? (
          <ChatThread
            key={activeChat}
            api={api}
            id={activeChat}
            viewer={viewer}
            canManage={canManage}
            locale={locale}
            labels={t}
            draft={drafts[activeChat] || ''}
            onDraft={updateDraft}
            onBack={() => select(undefined)}
            onManage={setEditor}
            onRead={readChat}
            sendDraft={sendDraft}
            sendingInBackground={!!sendingIds[activeChat]}
            refresh={refresh}
            onChanged={refreshChats}
            onArchived={(chat) => {
              setLoading(true);
              setArchivedCount((count) =>
                Math.max(
                  0,
                  count + (chat.archived ? 1 : -1),
                ),
              );
              setChats((current) =>
                current.filter(
                  (item) => item.id !== chat.id,
                ),
              );
              select(undefined);
              refreshChats();
            }}
          />
        ) : (
          <div className="ui-chat-welcome">
            <div className="ui-chat-welcome-icon">
              <Icon name="Chat" size={36} />
            </div>
            <h2>{t.choose}</h2>
            <p>{t.chooseHint}</p>
            <span className="ui-chat-help">
              {canManage ? t.staffInboxHint : t.generalHint}
            </span>
            {canManage && (
              <Button
                variant="secondary"
                icon="Plus"
                onClick={() => setEditor('new')}
              >
                {t.newChat}
              </Button>
            )}
          </div>
        )}
      </div>
      {editor && viewer && canManage && (
        <ChatGroupDialog
          api={api}
          viewer={viewer}
          chat={editor === 'new' ? undefined : editor}
          labels={t}
          onClose={() => setEditor(null)}
          onSaved={(chat) => {
            setEditor(null);
            setChats((current) => [
              chat,
              ...current.filter((c) => c.id !== chat.id),
            ]);
            setSearch('');
            setUnreadOnly(false);
            setArchived(false);
            select(chat.id);
            refreshChats();
          }}
        />
      )}
    </div>
  );
}
