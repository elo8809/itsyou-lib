import { FormEvent, useId, useState } from 'react';
import ActionDialog from '../workspace/ActionDialog';
import Button from '../base/Button';
import Icon from '../base/Icon';
import Input from '../base/Input';
import TextArea from '../base/TextArea';
import { InlineNotice } from '../workspace/Feedback';
import { fileRequest, fileSize } from './api';

export default function RequestFileDialog({
  url,
  fields,
  onClose,
  onSaved,
  resource = false,
  editing,
}: {
  url: string;
  fields: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
  resource?: boolean;
  editing?: { label: string; description: string };
}) {
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [uploadKey, setUploadKey] = useState('');
  const [label, setLabel] = useState(editing?.label || '');
  const [description, setDescription] = useState(
    editing?.description || '',
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const selectFile = (next?: File) => {
    if (!next) return;
    setError('');
    setFile(null);
    const allowed = resource
      ? [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
        ]
      : ['application/pdf'];
    if (!allowed.includes(next.type)) {
      setError(
        resource
          ? 'Bitte wählen Sie ein PDF, JPG, PNG oder WebP.'
          : 'Bitte wählen Sie einen PDF-Vertrag.',
      );
      return;
    }
    if (!next.size || next.size > 20 * 1024 * 1024) {
      setError('Die Datei darf maximal 20 MB groß sein.');
      return;
    }
    setFile(next);
    setUploadKey(crypto.randomUUID());
    if (resource && !label)
      setLabel(
        next.name.replace(/\.[^.]+$/, '').slice(0, 100),
      );
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing && !file) {
      setError('Bitte wählen Sie eine Datei aus.');
      return;
    }
    if (resource && !label.trim()) {
      setError('Bitte geben Sie eine Bezeichnung ein.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (editing)
        await fileRequest(url, {
          ...fields,
          label: label.trim(),
          description: description.trim(),
        });
      else {
        const data = new FormData();
        Object.entries(fields).forEach(([key, value]) =>
          data.set(key, value),
        );
        data.set('file', file!);
        data.set('uploadKey', uploadKey);
        if (resource) {
          data.set('label', label.trim());
          data.set('description', description.trim());
        }
        await fileRequest(url, data);
      }
      onSaved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Upload fehlgeschlagen. Bitte erneut versuchen.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <ActionDialog
      open
      onClose={onClose}
      busy={busy}
      closeLabel="Schließen"
      title={
        editing
          ? 'Ressource bearbeiten'
          : resource
            ? 'Ressource hochladen'
            : 'Unterschriebenen Vertrag hochladen'
      }
      description={
        resource
          ? 'Briefings, Ablaufpläne und Referenzen für Ihr Projekt. Zugewiesene Models können diese Dateien herunterladen.'
          : 'Laden Sie die unterschriebene Fassung Ihres Auftragsvertrags als PDF hoch.'
      }
      actions={
        <>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            form={id}
            isLoading={busy}
            icon={editing ? undefined : 'Upload'}
          >
            {editing
              ? 'Speichern'
              : busy
                ? 'Wird hochgeladen…'
                : 'Hochladen'}
          </Button>
        </>
      }
    >
      <form
        id={id}
        onSubmit={submit}
        className="ui-request-upload-form"
      >
        {!editing && (
          <label
            className="ui-request-file-drop"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!busy)
                selectFile(event.dataTransfer.files[0]);
            }}
          >
            <input
              type="file"
              aria-label="Datei auswählen"
              disabled={busy}
              accept={
                resource
                  ? '.pdf,.jpg,.jpeg,.png,.webp'
                  : '.pdf'
              }
              onChange={(event) =>
                selectFile(event.target.files?.[0])
              }
            />
            <Icon
              name={
                file
                  ? file.type === 'application/pdf'
                    ? 'File'
                    : 'Camera'
                  : 'Upload'
              }
              size={28}
            />
            <strong>
              {file
                ? file.name
                : 'Datei auswählen oder hier ablegen'}
            </strong>
            <span>
              {file
                ? `${fileSize(file.size)} · Klicken zum Ändern`
                : `${resource ? 'PDF, JPG, PNG oder WebP' : 'PDF'} · Maximal 20 MB`}
            </span>
          </label>
        )}
        {resource && (
          <>
            <Input
              label="Bezeichnung"
              value={label}
              onChange={(event) => {
                setLabel(event.target.value);
                setUploadKey(crypto.randomUUID());
              }}
              required
              maxLength={100}
              placeholder="z. B. Shooting-Briefing"
              disabled={busy}
              hideError
            />
            <TextArea
              label="Beschreibung (optional)"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setUploadKey(crypto.randomUUID());
              }}
              maxLength={2000}
              placeholder="Was soll das Team zu dieser Datei wissen?"
              disabled={busy}
              rows={3}
            />
          </>
        )}
        {error && (
          <InlineNotice tone="error">{error}</InlineNotice>
        )}
      </form>
    </ActionDialog>
  );
}
