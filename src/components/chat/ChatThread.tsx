import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Button from '../base/Button';
import Icon from '../base/Icon';
import ActionDialog from '../workspace/ActionDialog';
import ChatMessageEditor from './ChatMessageEditor';
import {
  EmptyState,
  InlineNotice,
} from '../workspace/Feedback';
import { ChatApiError, type ChatApi } from './api';
import type {
  ChatDetail,
  ChatLocale,
  ChatMessage,
  ChatViewer,
} from './types';
import type { ChatLabels } from './labels';
import {
  initials,
  mergeMessages,
  roleLabel,
} from './utils';

export default function ChatThread({
  api,
  id,
  viewer,
  canManage,
  locale,
  labels: t,
  draft,
  onDraft,
  onBack,
  onManage,
  onRead,
  sendDraft,
  sendingInBackground,
  refresh,
  onChanged,
  onArchived,
}: {
  api: ChatApi;
  id: string;
  viewer: ChatViewer;
  canManage: boolean;
  locale: ChatLocale;
  labels: ChatLabels;
  draft: string;
  onDraft: (id: string, text: string) => void;
  onBack: () => void;
  onManage: (chat: ChatDetail) => void;
  onRead: (id: string, sequence: number) => void;
  sendDraft: (
    id: string,
    body: string,
  ) => Promise<ChatMessage>;
  sendingInBackground: boolean;
  refresh: number;
  onChanged: () => void;
  onArchived: (chat: ChatDetail) => void;
}) {
  const [chat, setChat] = useState<ChatDetail | null>(null);
  const isGeneral = chat?.kind === 'GENERAL';
  const title =
    isGeneral && !viewer.canManage
      ? t.generalChat
      : chat?.title;
  const detailsLabel = isGeneral
    ? t.generalDetails
    : t.details;
  const canEditGroup = canManage && !isGeneral;
  const [messages, setMessages] = useState<ChatMessage[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [hasOlder, setHasOlder] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [error, setError] = useState('');
  const [revoked, setRevoked] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [sending, setSending] = useState(false);
  const [details, setDetails] = useState(false);
  const [editing, setEditing] =
    useState<ChatMessage | null>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveError, setArchiveError] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const [retry, setRetry] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const pinned = useRef(true);
  const lastFetched = useRef(0);
  const lastEdited = useRef(0);
  const editedMessages = useRef(
    new Map<string, ChatMessage>(),
  );
  const initialized = useRef(false);
  const lastRead = useRef(0);
  const latest = useRef(0);
  const readPending = useRef(false);
  const sendPending = useRef(false);
  const mounted = useRef(true);
  const olderController = useRef<AbortController | null>(
    null,
  );
  const prependPosition = useRef<{
    height: number;
    top: number;
  } | null>(null);
  const forbidden = useCallback((error: unknown) => {
    if (
      error instanceof ChatApiError &&
      [401, 403, 404].includes(error.status)
    ) {
      setRevoked(true);
      setChat(null);
      setMessages([]);
      setDetails(false);
      setEditing(null);
      initialized.current = false;
      lastFetched.current = 0;
      lastEdited.current = 0;
      editedMessages.current.clear();
      latest.current = 0;
      return true;
    }
    return false;
  }, []);

  const markRead = useCallback(async () => {
    const position = latest.current;
    const bounds =
      scroller.current?.getBoundingClientRect();
    if (
      !pinned.current ||
      !bounds ||
      !bounds.height ||
      bounds.bottom > window.innerHeight ||
      bounds.bottom <= 0 ||
      bounds.right <= 0 ||
      bounds.left >= window.innerWidth ||
      document.hidden ||
      !document.hasFocus() ||
      position <= lastRead.current ||
      readPending.current
    )
      return;
    readPending.current = true;
    try {
      await api.read(id, position);
      if (mounted.current) {
        lastRead.current = position;
        onRead(id, position);
      }
    } catch (e) {
      if (mounted.current) forbidden(e);
    } finally {
      readPending.current = false;
    }
  }, [api, id, onRead, forbidden]);

  // An embedded chat can be below the request brief; scrolling the page into
  // view must precede marking its newest messages as read.
  useEffect(() => {
    const readVisible = () => {
      void markRead();
    };
    window.addEventListener('scroll', readVisible, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', readVisible);
    return () => {
      window.removeEventListener(
        'scroll',
        readVisible,
        true,
      );
      window.removeEventListener('resize', readVisible);
    };
  }, [markRead]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      olderController.current?.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    async function sync() {
      if (running || document.hidden) return;
      running = true;
      try {
        const detail = await api.detail(
          id,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setChat(detail);
        lastRead.current = Math.max(
          lastRead.current,
          detail.lastReadSequence,
        );
        if (!initialized.current) {
          lastEdited.current = detail.editSequence || 0;
          const page = await api.messages(
            id,
            {},
            controller.signal,
          );
          if (controller.signal.aborted) return;
          setMessages(page.items);
          setHasOlder(page.hasMore);
          lastFetched.current =
            page.items.at(-1)?.sequence || 0;
          latest.current = lastFetched.current;
          initialized.current = true;
        } else {
          let more = true;
          while (more && !controller.signal.aborted) {
            const page = await api.messages(
              id,
              { after: lastFetched.current },
              controller.signal,
            );
            if (controller.signal.aborted) return;
            if (page.items.length) {
              setMessages((current) =>
                mergeMessages(current, page.items),
              );
              lastFetched.current =
                page.items.at(-1)!.sequence;
              latest.current = Math.max(
                latest.current,
                lastFetched.current,
              );
              if (!pinned.current) setUnseen(true);
            }
            more = page.hasMore && page.items.length > 0;
          }
        }
        if (
          (detail.editSequence || 0) > lastEdited.current
        ) {
          let more = true;
          while (more && !controller.signal.aborted) {
            const page = await api.edits(
              id,
              lastEdited.current,
              controller.signal,
            );
            if (controller.signal.aborted) return;
            for (const message of page.items) {
              const previous = editedMessages.current.get(
                message.id,
              );
              if (
                !previous ||
                (message.editSequence || 0) >=
                  (previous.editSequence || 0)
              )
                editedMessages.current.set(
                  message.id,
                  message,
                );
            }
            setMessages((current) => {
              const loaded = new Set(
                current.map((message) => message.id),
              );
              return mergeMessages(
                current,
                page.items.filter((message) =>
                  loaded.has(message.id),
                ),
              );
            });
            if (page.items.length)
              lastEdited.current =
                page.items.at(-1)!.editSequence ||
                lastEdited.current;
            more = page.hasMore && page.items.length > 0;
          }
        }
        setError('');
        setRevoked(false);
        void markRead();
      } catch (e) {
        if (!controller.signal.aborted && !forbidden(e))
          setError(
            initialized.current ? t.reconnect : t.error,
          );
      } finally {
        running = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void sync();
    const timer = setInterval(() => void sync(), 3000);
    const wake = () => {
      void sync();
      void markRead();
    };
    window.addEventListener('focus', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('focus', wake);
      document.removeEventListener(
        'visibilitychange',
        wake,
      );
    };
  }, [api, id, retry, refresh, markRead, forbidden, t]);

  useLayoutEffect(() => {
    const node = scroller.current;
    if (!node) return;
    if (prependPosition.current) {
      node.scrollTop =
        prependPosition.current.top +
        node.scrollHeight -
        prependPosition.current.height;
      prependPosition.current = null;
    } else if (pinned.current)
      node.scrollTop = node.scrollHeight;
    void markRead();
  }, [messages, loading, markRead]);

  async function loadOlder() {
    if (olderLoading || !messages.length) return;
    const controller = new AbortController();
    olderController.current = controller;
    setOlderLoading(true);
    try {
      const page = await api.messages(
        id,
        { before: messages[0].sequence },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      const node = scroller.current;
      if (node)
        prependPosition.current = {
          height: node.scrollHeight,
          top: node.scrollTop,
        };
      pinned.current = false;
      setMessages((current) => {
        const corrections = page.items.flatMap(
          (message) => {
            const edited = editedMessages.current.get(
              message.id,
            );
            return edited ? [edited] : [];
          },
        );
        return mergeMessages(
          mergeMessages(current, page.items),
          corrections,
        );
      });
      setHasOlder(page.hasMore);
      setError('');
    } catch (e) {
      if (!controller.signal.aborted && !forbidden(e))
        setError(t.error);
    } finally {
      if (!controller.signal.aborted)
        setOlderLoading(false);
    }
  }

  async function send() {
    const body = draft.trim();
    if (
      !body ||
      body.length > 5000 ||
      sendPending.current ||
      sendingInBackground ||
      loading ||
      revoked ||
      !chat
    )
      return;
    sendPending.current = true;
    setSending(true);
    setSendError(false);
    try {
      const message = await sendDraft(id, body);
      if (!mounted.current) return;
      pinned.current = true;
      setMessages((current) =>
        mergeMessages(current, [message]),
      );
      latest.current = Math.max(
        latest.current,
        message.sequence,
      );
      lastRead.current = message.sequence;
      onRead(id, message.sequence);
    } catch (e) {
      if (mounted.current) {
        forbidden(e);
        setSendError(true);
      }
    } finally {
      sendPending.current = false;
      if (mounted.current) {
        setSending(false);
        setTimeout(() => composer.current?.focus(), 0);
      }
    }
  }
  async function archive() {
    if (!chat || chat.isUnstarted || archiveBusy) return;
    setArchiveBusy(true);
    setArchiveError(false);
    try {
      const saved = await api.archive(id, !chat.archived);
      if (mounted.current) {
        setChat(saved);
        onArchived(saved);
      }
    } catch (e) {
      if (mounted.current && !forbidden(e))
        setArchiveError(true);
    } finally {
      if (mounted.current) setArchiveBusy(false);
    }
  }
  function dateLabel(date: string) {
    const when = new Date(date),
      today = new Date(),
      yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (when.toDateString() === today.toDateString())
      return t.today;
    if (when.toDateString() === yesterday.toDateString())
      return t.yesterday;
    return when.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  if (revoked)
    return (
      <div className="ui-chat-thread">
        <EmptyState
          icon="Chat"
          title={t.readOnly}
          action={
            <Button variant="secondary" onClick={onBack}>
              {t.back}
            </Button>
          }
        />
      </div>
    );
  return (
    <section
      className="ui-chat-thread"
      aria-label={title || t.chats}
    >
      <header className="ui-chat-thread-header">
        <button
          type="button"
          className="ui-icon-button ui-chat-mobile-back"
          onClick={onBack}
          aria-label={t.back}
        >
          <Icon
            name="ArrowRight"
            className="ui-chat-arrow-back"
            size={18}
          />
        </button>
        <span className="ui-chat-avatar ui-chat-group-avatar">
          <Icon
            name={isGeneral ? 'Chat' : 'Users'}
            size={21}
          />
        </span>
        <div className="ui-chat-thread-title">
          <h2 title={title || t.loading}>
            {title || t.loading}
          </h2>
          <button
            type="button"
            onClick={() => setDetails(true)}
            disabled={!chat}
          >
            {chat
              ? isGeneral
                ? viewer.canManage
                  ? `${t.generalChat} · ${roleLabel(chat.owner?.role || 'REMOVED', t)}`
                  : t.agencyTeam
                : `${chat.participantCount} ${t.participants}`
              : t.loading}
          </button>
        </div>
        <button
          type="button"
          className="ui-icon-button"
          aria-label={detailsLabel}
          onClick={() => setDetails(true)}
          disabled={!chat}
        >
          <Icon name="Info" size={19} />
        </button>
        {canEditGroup && chat && (
          <button
            type="button"
            className="ui-icon-button"
            aria-label={t.manage}
            onClick={() => onManage(chat)}
          >
            <Icon name="Settings" size={19} />
          </button>
        )}
        {chat && !chat.isUnstarted && (
          <button
            type="button"
            className="ui-icon-button"
            disabled={archiveBusy}
            aria-busy={archiveBusy}
            aria-label={
              chat.archived ? t.restore : t.archive
            }
            title={chat.archived ? t.restore : t.archive}
            onClick={() => void archive()}
          >
            <Icon
              name={
                chat.archived ? 'ArrowNarrowUp' : 'Archive'
              }
              size={19}
            />
          </button>
        )}
      </header>
      {archiveError && (
        <InlineNotice tone="error">
          {t.archiveError}
        </InlineNotice>
      )}
      {chat?.archived && (
        <div
          className="ui-chat-archived-notice"
          role="status"
        >
          <Icon
            name="Archive"
            size={15}
            aria-hidden="true"
          />
          <span>{t.archiveHint}</span>
        </div>
      )}
      {error && (
        <InlineNotice
          tone="error"
          action={
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
            >
              {t.retry}
            </button>
          }
        >
          {error}
        </InlineNotice>
      )}
      <div
        ref={scroller}
        className="ui-chat-messages"
        role="log"
        aria-label={t.chats}
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={loading}
        onScroll={() => {
          const node = scroller.current!;
          pinned.current =
            node.scrollHeight -
              node.scrollTop -
              node.clientHeight <
            70;
          if (pinned.current) {
            setUnseen(false);
            void markRead();
          }
        }}
      >
        {loading ? (
          <EmptyState loading loadingLabel={t.loading} />
        ) : (
          <>
            {hasOlder && (
              <div className="ui-chat-load-older">
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={olderLoading}
                  onClick={() => void loadOlder()}
                >
                  {t.older}
                </Button>
              </div>
            )}
            {!messages.length && !error && (
              <EmptyState
                icon="Chat"
                title={
                  isGeneral
                    ? t.generalFirstMessage
                    : t.firstMessage
                }
                description={
                  isGeneral
                    ? t.generalFirstMessageHint
                    : t.firstMessageHint
                }
              />
            )}
            {messages.map((message, index) => {
              const own = message.senderId === viewer.id;
              const day = dateLabel(message.createdAt);
              const showDay =
                index === 0 ||
                dateLabel(messages[index - 1].createdAt) !==
                  day;
              const grouped =
                !showDay &&
                messages[index - 1].senderId ===
                  message.senderId &&
                new Date(message.createdAt).getTime() -
                  new Date(
                    messages[index - 1].createdAt,
                  ).getTime() <
                  300000;
              return (
                <Fragment key={message.id}>
                  {showDay && (
                    <div className="ui-chat-date">
                      <span>{day}</span>
                    </div>
                  )}
                  <article
                    className="ui-chat-message"
                    data-own={own}
                    data-grouped={grouped}
                  >
                    {!own && (
                      <span
                        className="ui-chat-avatar ui-chat-message-avatar"
                        data-role={message.senderRole}
                        aria-hidden="true"
                      >
                        {!grouped &&
                          initials(message.senderName)}
                      </span>
                    )}
                    <div className="ui-chat-message-content">
                      {!grouped && (
                        <div className="ui-chat-sender">
                          <strong>
                            {own
                              ? t.you
                              : message.senderName}
                          </strong>
                          <span>
                            {roleLabel(
                              message.senderRole,
                              t,
                            )}
                          </span>
                        </div>
                      )}
                      <div className="ui-chat-bubble">
                        <p dir="auto">{message.body}</p>
                        <div className="ui-chat-message-meta">
                          {own && (
                            <button
                              type="button"
                              className="ui-chat-edit-message"
                              aria-label={t.editMessage}
                              title={t.editMessage}
                              onClick={() =>
                                setEditing(message)
                              }
                            >
                              <Icon
                                name="Pen"
                                size={14}
                                aria-hidden="true"
                              />
                            </button>
                          )}
                          <time
                            dateTime={message.createdAt}
                            title={new Date(
                              message.createdAt,
                            ).toLocaleString(locale)}
                          >
                            {message.editedAt && (
                              <span
                                title={new Date(
                                  message.editedAt,
                                ).toLocaleString(locale)}
                              >
                                {t.edited} ·{' '}
                              </span>
                            )}
                            {new Date(
                              message.createdAt,
                            ).toLocaleTimeString(locale, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {own && (
                              <Icon
                                name="Success"
                                size={12}
                                aria-hidden="true"
                              />
                            )}
                          </time>
                        </div>
                      </div>
                    </div>
                  </article>
                </Fragment>
              );
            })}
          </>
        )}
      </div>
      {unseen && (
        <button
          type="button"
          className="ui-chat-new-messages"
          onClick={() => {
            pinned.current = true;
            scroller.current?.scrollTo({
              top: scroller.current.scrollHeight,
              behavior: 'smooth',
            });
            setUnseen(false);
            void markRead();
          }}
        >
          {t.newMessages}
          <Icon name="ArrowNarrowDown" size={15} />
        </button>
      )}
      <form
        className="ui-chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        {sendError && (
          <p role="alert" className="ui-chat-send-error">
            {t.sendError}
          </p>
        )}
        <div className="ui-chat-composer-field">
          <textarea
            ref={composer}
            aria-label={t.composer}
            placeholder={t.placeholder}
            rows={2}
            maxLength={5000}
            value={draft}
            disabled={
              sending ||
              sendingInBackground ||
              loading ||
              !chat
            }
            onChange={(e) => onDraft(id, e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            type="submit"
            className="ui-chat-send"
            aria-label={
              sending || sendingInBackground
                ? t.sending
                : t.send
            }
            disabled={
              sending ||
              sendingInBackground ||
              loading ||
              !draft.trim() ||
              !chat
            }
          >
            <Icon
              name={
                sending || sendingInBackground
                  ? 'Hourglass'
                  : 'Send'
              }
              size={19}
            />
          </button>
        </div>
        <div className="ui-chat-composer-help">
          <span>{t.hint}</span>
          <span>
            {draft.length.toLocaleString(locale)}/5,000
          </span>
        </div>
      </form>
      {details && chat && (
        <ActionDialog
          open
          onClose={() => setDetails(false)}
          title={detailsLabel}
          description={title}
          closeLabel={t.close}
        >
          <div className="ui-chat-details">
            {chat.description && (
              <p className="ui-chat-description">
                {chat.description}
              </p>
            )}
            <div className="ui-chat-section-label">
              <strong>{t.participants}</strong>
              <span>{chat.participantCount}</span>
            </div>
            <div className="ui-chat-participants">
              {chat.participants.map((p) => (
                <div
                  key={p.id}
                  className="ui-chat-person-option"
                >
                  <span
                    className="ui-chat-avatar"
                    data-role={p.role}
                  >
                    {initials(p.name)}
                  </span>
                  <span className="ui-chat-person-name">
                    <strong title={p.name}>
                      {p.name}
                      {p.id === viewer.id
                        ? ` (${t.you})`
                        : ''}
                    </strong>
                  </span>
                  <span className="ui-chat-role">
                    {roleLabel(p.role, t)}
                  </span>
                </div>
              ))}
            </div>
            <p className="ui-chat-help">
              {isGeneral ? t.generalPrivate : t.private}
            </p>
            {canEditGroup && (
              <Button
                variant="secondary"
                icon="Settings"
                onClick={() => {
                  setDetails(false);
                  onManage(chat);
                }}
              >
                {t.manage}
              </Button>
            )}
          </div>
        </ActionDialog>
      )}
      {editing && (
        <ChatMessageEditor
          api={api}
          chatId={id}
          message={editing}
          labels={t}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            editedMessages.current.set(message.id, message);
            setMessages((current) =>
              mergeMessages(current, [message]),
            );
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </section>
  );
}
