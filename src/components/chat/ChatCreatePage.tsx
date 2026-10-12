import { useEffect, useMemo, useState } from 'react';
import Button from '../base/Button';
import PageHeader from '../workspace/PageHeader';
import {
  EmptyState,
  InlineNotice,
} from '../workspace/Feedback';
import { ChatApiError, createChatApi } from './api';
import ChatGroupForm from './ChatGroupForm';
import { chatLabels } from './labels';
import type {
  ChatDetail,
  ChatLocale,
  ChatRequestDraft,
} from './types';

/** Request-based creation uses the same form and validation as the chat editor. */
export default function ChatCreatePage({
  apiBaseUrl,
  clientRequestId,
  locale = 'en',
  onCancel,
  onCreated,
  onOpenChat,
}: {
  apiBaseUrl: string;
  clientRequestId: string;
  locale?: ChatLocale;
  onCancel: () => void;
  onCreated: (chat: ChatDetail) => void;
  /** Opens the request's existing group chat. */
  onOpenChat: (chatId: string) => void;
}) {
  const api = useMemo(
    () => createChatApi(apiBaseUrl),
    [apiBaseUrl],
  );
  const t = chatLabels[locale];
  const [data, setData] = useState<ChatRequestDraft | null>(
    null,
  );
  const [error, setError] = useState(false);
  const [existingChatId, setExistingChatId] = useState<string | null>(
    null,
  );
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(false);
    setExistingChatId(null);
    api
      .requestDraft(clientRequestId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const existing =
          err instanceof ChatApiError && err.details.existingChatId;
        if (typeof existing === 'string') setExistingChatId(existing);
        else setError(true);
      });
    return () => controller.abort();
  }, [api, clientRequestId, retry]);
  return (
    <div className="ui-chat-create-page">
      <PageHeader
        title={t.newChat}
        subtitle={t.requestCreateHint}
        onBack={onCancel}
        backLabel={t.request}
      />
      {existingChatId ? (
        <EmptyState
          icon="Chat"
          title={t.existingChatTitle}
          description={t.existingChatDescription}
          action={
            <Button onClick={() => onOpenChat(existingChatId)}>
              {t.openChat}
            </Button>
          }
        />
      ) : error ? (
        <EmptyState
          title={t.error}
          action={
            <Button onClick={() => setRetry((n) => n + 1)}>
              {t.retry}
            </Button>
          }
        />
      ) : !data ? (
        <EmptyState loading loadingLabel={t.loading} />
      ) : (
        <>
          {(data.missingClientAccount ||
            data.missingModelAccounts > 0) && (
            <InlineNotice tone="neutral">
              {data.missingClientAccount && (
                <p>{t.missingClientAccount}</p>
              )}
              {data.missingModelAccounts > 0 && (
                <p>
                  {data.missingModelAccounts}{' '}
                  {t.missingModelAccounts}
                </p>
              )}
            </InlineNotice>
          )}
          <ChatGroupForm
            key={clientRequestId}
            api={api}
            viewer={data.viewer}
            initialValues={data.draft}
            presentation="page"
            lockRequest
            labels={t}
            onClose={onCancel}
            onSaved={onCreated}
          />
        </>
      )}
    </div>
  );
}
