import { useId, useState } from 'react';
import Button from '../base/Button';
import TextArea from '../base/TextArea';
import ActionDialog from '../workspace/ActionDialog';
import { InlineNotice } from '../workspace/Feedback';
import { ChatApiError, type ChatApi } from './api';
import type { ChatMessage } from './types';
import type { ChatLabels } from './labels';

export default function ChatMessageEditor({
  api,
  chatId,
  message,
  labels: t,
  onClose,
  onSaved,
}: {
  api: ChatApi;
  chatId: string;
  message: ChatMessage;
  labels: ChatLabels;
  onClose: () => void;
  onSaved: (message: ChatMessage) => void;
}) {
  const formId = useId();
  const [body, setBody] = useState(message.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    if (busy || !body.trim() || body.length > 5000) return;
    setBusy(true);
    setError('');
    try {
      const saved = await api.edit(
        chatId,
        message.id,
        body.trim(),
        message.editSequence || 0,
      );
      onSaved(saved);
    } catch (e) {
      setError(
        e instanceof ChatApiError && e.status === 409
          ? t.editConflict
          : t.editError,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <ActionDialog
      open
      onClose={onClose}
      title={t.editMessage}
      description={t.editHint}
      busy={busy}
      closeLabel={t.close}
      actions={
        <>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={onClose}
          >
            {t.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            isLoading={busy}
            disabled={
              !body.trim() || body.trim() === message.body
            }
          >
            {t.save}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="ui-chat-edit-form"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <TextArea
          autoFocus
          label={t.composer}
          value={body}
          maxLength={5000}
          rows={5}
          disabled={busy}
          onChange={(event) => setBody(event.target.value)}
        />
        <span className="ui-chat-help">
          {body.length.toLocaleString()}/5,000
        </span>
        {error && (
          <InlineNotice tone="error">{error}</InlineNotice>
        )}
      </form>
    </ActionDialog>
  );
}
