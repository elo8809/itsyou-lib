import { useEffect, useState } from 'react';
import ActionDialog from '../workspace/ActionDialog';
import Button from '../base/Button';
import Input from '../base/Input';
import TextArea from '../base/TextArea';
import Icon from '../base/Icon';
import { InlineNotice } from '../workspace/Feedback';
import type { ChatApi } from './api';
import type {
  ChatDetail,
  ChatGroupDefaults,
  ChatPerson,
  ChatViewer,
} from './types';
import type { ChatLabels } from './labels';
import { initials, roleLabel } from './utils';
import ChatRequestPicker from './ChatRequestPicker';
import type { ChatRequest } from './types';

export default function ChatGroupForm({
  api,
  viewer,
  chat,
  initialValues,
  presentation = 'dialog',
  lockRequest = false,
  labels: t,
  onClose,
  onSaved,
}: {
  api: ChatApi;
  viewer: ChatViewer;
  chat?: ChatDetail;
  initialValues?: ChatGroupDefaults;
  presentation?: 'dialog' | 'page';
  lockRequest?: boolean;
  labels: ChatLabels;
  onClose: () => void;
  onSaved: (chat: ChatDetail) => void;
}) {
  const [title, setTitle] = useState(
    chat?.title || initialValues?.title || '',
  );
  const [request, setRequest] =
    useState<ChatRequest | null>(
      chat?.request || initialValues?.request || null,
    );
  const [description, setDescription] = useState(
    chat?.description || initialValues?.description || '',
  );
  const [selected, setSelected] = useState<ChatPerson[]>(
    chat?.participants ||
      initialValues?.participants || [viewer],
  );
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [people, setPeople] = useState<ChatPerson[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [directoryError, setDirectoryError] =
    useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setDirectoryError(false);
    setPeople([]);
    setCursor(null);
    const timer = setTimeout(() => {
      api
        .directory(
          query,
          role || undefined,
          undefined,
          controller.signal,
        )
        .then((data) => {
          setPeople(data.items);
          setCursor(data.nextCursor);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setDirectoryError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [api, query, role, retry]);
  // Key the directory to its filters so a stale load-more response is discarded.
  const [moreRequest, setMoreRequest] = useState<
    string | null
  >(null);
  useEffect(() => {
    if (!moreRequest) return;
    const controller = new AbortController();
    setLoading(true);
    api
      .directory(
        query,
        role || undefined,
        moreRequest,
        controller.signal,
      )
      .then((data) => {
        setPeople((current) => [
          ...new Map(
            [...current, ...data.items].map((p) => [
              p.id,
              p,
            ]),
          ).values(),
        ]);
        setCursor(data.nextCursor);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setDirectoryError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setMoreRequest(null);
        }
      });
    return () => controller.abort();
  }, [api, moreRequest, query, role]);

  async function save() {
    setBusy(true);
    setError('');
    try {
      const draft = {
        title,
        description,
        participantIds: selected.map((p) => p.id),
        clientRequestId: request?.id || null,
      };
      const result = chat
        ? await api.update(chat.id, chat.revision, draft)
        : await api.create(draft);
      onSaved(result);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : t.error,
      );
    } finally {
      setBusy(false);
    }
  }
  function toggle(person: ChatPerson) {
    if (person.id === viewer.id) return;
    setSelected((current) =>
      current.some((p) => p.id === person.id)
        ? current.filter((p) => p.id !== person.id)
        : [...current, person],
    );
  }
  const actions = (
    <>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={onClose}
      >
        {t.cancel}
      </Button>
      <Button
        icon="Chat"
        isLoading={busy}
        disabled={
          !title.trim() ||
          selected.length < 2 ||
          selected.length > 200
        }
        onClick={() => void save()}
      >
        {chat ? t.save : t.create}
      </Button>
    </>
  );
  const fields = (
    <div className="ui-chat-group-form">
      {error && (
        <InlineNotice tone="error">{error}</InlineNotice>
      )}
      {lockRequest && request ? (
        <div className="ui-chat-request-context">
          <Icon name="Inbox" size={22} />
          <div>
            <span>{t.request}</span>
            <strong>{request.project}</strong>
            <small>{request.client.name}</small>
          </div>
        </div>
      ) : (
        <ChatRequestPicker
          api={api}
          value={request}
          onChange={setRequest}
          disabled={busy}
          labels={t}
        />
      )}
      <Input
        label={t.groupName}
        placeholder={t.groupNamePlaceholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        disabled={busy}
        autoFocus
      />
      <TextArea
        label={t.description}
        placeholder={t.descriptionPlaceholder}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
        rows={2}
        disabled={busy}
      />
      <div className="ui-chat-section-label">
        <strong>{t.participants}</strong>
        <span>
          {selected.length}/200 {t.selected}
        </span>
      </div>
      <div
        className="ui-chat-selected"
        aria-label={t.participants}
      >
        {selected.map((p) => (
          <span key={p.id} className="ui-chat-chip">
            {p.name}
            {p.id === viewer.id ? (
              ` (${t.you})`
            ) : (
              <button
                type="button"
                disabled={busy}
                aria-label={`${t.remove} ${p.name}`}
                onClick={() => toggle(p)}
              >
                <Icon name="Close" size={13} />
              </button>
            )}
          </span>
        ))}
      </div>
      <p className="ui-chat-help">{t.selfHint}</p>
      <div className="ui-chat-directory-filters">
        <Input
          icon="Search"
          aria-label={t.searchPeople}
          placeholder={t.searchPeople}
          value={query}
          maxLength={120}
          onChange={(e) => {
            setMoreRequest(null);
            setQuery(e.target.value);
          }}
        />
        <select
          className="ui-input"
          aria-label={t.allRoles}
          value={role}
          onChange={(e) => {
            setMoreRequest(null);
            setRole(e.target.value);
          }}
        >
          <option value="">{t.allRoles}</option>
          {(
            ['ADMIN', 'MEMBER', 'CLIENT', 'USER'] as const
          ).map((r) => (
            <option key={r} value={r}>
              {roleLabel(r, t)}
            </option>
          ))}
        </select>
      </div>
      <div
        className="ui-chat-directory"
        aria-busy={loading}
      >
        {people.map((p) => (
          <label
            key={p.id}
            className="ui-chat-person-option"
          >
            <input
              type="checkbox"
              checked={selected.some((s) => s.id === p.id)}
              disabled={
                busy ||
                p.id === viewer.id ||
                (selected.length >= 200 &&
                  !selected.some((s) => s.id === p.id))
              }
              onChange={() => toggle(p)}
            />
            <span
              className="ui-chat-avatar"
              data-role={p.role}
            >
              {initials(p.name)}
            </span>
            <span className="ui-chat-person-name">
              <strong>{p.name}</strong>
              <small>
                {[p.email, p.client?.name]
                  .filter(Boolean)
                  .join(' · ')}
              </small>
            </span>
            <span className="ui-chat-role">
              {roleLabel(p.role, t)}
            </span>
          </label>
        ))}
        {loading && (
          <p className="ui-chat-help" role="status">
            {t.loading}
          </p>
        )}
        {!loading && !people.length && !directoryError && (
          <p className="ui-chat-help">{t.noPeople}</p>
        )}
        {directoryError && (
          <Button
            variant="ghost"
            onClick={() => {
              setMoreRequest(null);
              setRetry((n) => n + 1);
            }}
          >
            {t.retry}
          </Button>
        )}
        {cursor && !loading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMoreRequest(cursor)}
          >
            {t.more}
          </Button>
        )}
      </div>
      <p className="ui-chat-help">
        {selected.length < 2
          ? t.choosePeople
          : t.historyHint}
      </p>
    </div>
  );
  return presentation === 'page' ? (
    <div className="ui-chat-create-card">
      {fields}
      <div className="ui-chat-create-actions">
        {actions}
      </div>
    </div>
  ) : (
    <ActionDialog
      open
      onClose={onClose}
      title={chat ? t.manage : t.newChat}
      description={t.createHint}
      busy={busy}
      closeLabel={t.close}
      actions={actions}
    >
      {fields}
    </ActionDialog>
  );
}
