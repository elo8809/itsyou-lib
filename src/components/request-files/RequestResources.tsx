import { useState } from 'react';
import Button from '../base/Button';
import Icon from '../base/Icon';
import Input from '../base/Input';
import {
  EmptyState,
  InlineNotice,
  Skeleton,
} from '../workspace/Feedback';
import ActionDialog from '../workspace/ActionDialog';
import FileDownloadButton from './FileDownloadButton';
import RequestFileDialog from './RequestFileDialog';
import {
  fileRequest,
  fileSize,
  requestFileUrl,
  useRequestFiles,
} from './api';
export type RequestResource = {
  id: string;
  label: string;
  description: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
};
export default function RequestResources({
  apiBaseUrl,
  clientRequestId,
  canManage = false,
  active = true,
}: {
  apiBaseUrl: string;
  clientRequestId: string;
  canManage?: boolean;
  active?: boolean;
}) {
  const url = requestFileUrl(apiBaseUrl, 'resources');
  const { data, error, refresh } =
    useRequestFiles<RequestResource>(
      `${url}?clientRequestId=${encodeURIComponent(clientRequestId)}`,
      active,
    );
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<
    RequestResource | 'new' | null
  >(null);
  const [remove, setRemove] =
    useState<RequestResource | null>(null);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [notice, setNotice] = useState('');
  const rows = (data || []).filter((item) =>
    [item.label, item.description, item.fileName]
      .join(' ')
      .toLocaleLowerCase('de')
      .includes(search.trim().toLocaleLowerCase('de')),
  );
  return (
    <div className="ui-request-files">
      <div className="ui-request-files-heading">
        <div>
          <h2>Ressourcen</h2>
          <p>
            {canManage
              ? 'Briefings, Ablaufpläne und Bildreferenzen – geteilt mit Ihren zugewiesenen Models.'
              : 'Alle Unterlagen und Referenzen für deinen Auftrag.'}
          </p>
        </div>
        {canManage && (
          <Button
            icon="Upload"
            onClick={() => setEditor('new')}
          >
            Datei hochladen
          </Button>
        )}
      </div>
      {notice && <InlineNotice>{notice}</InlineNotice>}
      {error && (
        <InlineNotice
          tone="error"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={refresh}
            >
              Erneut versuchen
            </Button>
          }
        >
          {error}
        </InlineNotice>
      )}
      {!data && !error ? (
        <Skeleton className="h-48" />
      ) : data && !data.length ? (
        <EmptyState
          icon="File"
          title="Noch keine Ressourcen"
          description={
            canManage
              ? 'Laden Sie ein Briefing, einen Ablaufplan oder Referenzbilder für das Team hoch.'
              : 'Sobald Unterlagen zu diesem Auftrag geteilt werden, kannst du sie hier herunterladen.'
          }
        />
      ) : (
        data && (
          <>
            <Input
              type="search"
              hideError
              icon="Search"
              aria-label="Ressourcen suchen"
              placeholder="Bezeichnung, Beschreibung oder Dateiname suchen"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
            {!rows.length ? (
              <EmptyState
                icon="Search"
                title="Keine passenden Ressourcen"
                description="Versuchen Sie einen anderen Suchbegriff."
              />
            ) : (
              <div className="ui-request-resource-list">
                {rows.map((item) => (
                  <article
                    key={item.id}
                    className="ui-request-resource"
                  >
                    <span className="ui-request-file-icon">
                      <Icon
                        name={
                          item.contentType ===
                          'application/pdf'
                            ? 'File'
                            : 'Camera'
                        }
                        size={24}
                      />
                    </span>
                    <div className="ui-request-resource-copy">
                      <h3>{item.label}</h3>
                      {item.description && (
                        <p>{item.description}</p>
                      )}
                      <div className="ui-request-file-meta">
                        <span>{item.fileName}</span>
                        <span>{fileSize(item.size)}</span>
                        <time dateTime={item.createdAt}>
                          {new Date(
                            item.createdAt,
                          ).toLocaleDateString('de-DE')}
                        </time>
                      </div>
                    </div>
                    <div className="ui-request-file-actions">
                      <FileDownloadButton
                        url={`${url}/download?id=${item.id}`}
                        fileName={item.fileName}
                      />
                      {canManage && (
                        <div className="ui-request-file-edit">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="Pen"
                            aria-label={`${item.label} bearbeiten`}
                            onClick={() => setEditor(item)}
                          >
                            Bearbeiten
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="Trash"
                            aria-label={`${item.label} entfernen`}
                            onClick={() => {
                              setRemoveError('');
                              setRemove(item);
                            }}
                          >
                            Entfernen
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p
              className="ui-request-file-count"
              aria-live="polite"
            >
              {rows.length}{' '}
              {rows.length === 1 ? 'Datei' : 'Dateien'}
            </p>
          </>
        )
      )}
      {editor && (
        <RequestFileDialog
          resource
          url={editor === 'new' ? url : `${url}/update`}
          fields={
            editor === 'new'
              ? { clientRequestId }
              : { id: editor.id }
          }
          editing={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setNotice(
              editor === 'new'
                ? ''
                : 'Ressource aktualisiert.',
            );
            setEditor(null);
            refresh();
          }}
        />
      )}
      <ActionDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        busy={busy}
        closeLabel="Schließen"
        title="Ressource entfernen?"
        description={`„${remove?.label || ''}“ wird aus dieser Anfrage entfernt und ist für Models nicht mehr verfügbar.`}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setRemove(null)}
            >
              Abbrechen
            </Button>
            <Button
              isLoading={busy}
              onClick={async () => {
                if (!remove) return;
                setBusy(true);
                setRemoveError('');
                try {
                  await fileRequest(`${url}/remove`, {
                    id: remove.id,
                  });
                  setRemove(null);
                  refresh();
                  setNotice('Ressource entfernt.');
                } catch (error) {
                  setRemoveError(
                    error instanceof Error
                      ? error.message
                      : 'Bitte erneut versuchen.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Entfernen
            </Button>
          </>
        }
      >
        {removeError && (
          <InlineNotice tone="error">
            {removeError}
          </InlineNotice>
        )}
      </ActionDialog>
    </div>
  );
}
