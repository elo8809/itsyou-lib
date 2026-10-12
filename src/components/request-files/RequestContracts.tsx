import { useState } from 'react';
import Button from '../base/Button';
import Icon from '../base/Icon';
import {
  Badge,
  EmptyState,
  InlineNotice,
  Skeleton,
} from '../workspace/Feedback';
import FileDownloadButton from './FileDownloadButton';
import RequestFileDialog from './RequestFileDialog';
import { requestFileUrl, useRequestFiles } from './api';
export type RequestClientContract = {
  id: string;
  orderId: string;
  project: string;
  createdAt: string;
  status: string;
  signed: boolean;
  canUpload: boolean;
};
export default function RequestContracts({
  apiBaseUrl,
  clientRequestId,
  active = true,
}: {
  apiBaseUrl: string;
  clientRequestId: string;
  active?: boolean;
}) {
  const url = requestFileUrl(apiBaseUrl, 'contracts');
  const { data, error, refresh } =
    useRequestFiles<RequestClientContract>(
      `${url}?clientRequestId=${encodeURIComponent(clientRequestId)}`,
      active,
    );
  const [upload, setUpload] =
    useState<RequestClientContract | null>(null);
  const [notice, setNotice] = useState('');
  return (
    <div className="ui-request-files">
      <div className="ui-request-files-heading">
        <div>
          <h2>Verträge</h2>
          <p>
            Ihre Auftragsverträge und unterschriebenen
            Unterlagen an einem Ort.
          </p>
        </div>
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
          title="Noch kein Vertrag verfügbar"
          description="Sobald die Agentur einen Auftragsvertrag für diese Anfrage erstellt hat, können Sie ihn hier herunterladen."
        />
      ) : (
        data?.map((contract) => (
          <section
            key={contract.id}
            className="ui-request-contract"
          >
            <div className="ui-request-contract-heading">
              <div>
                <p>AUFTRAGSVERTRAG</p>
                <h3>{contract.project}</h3>
              </div>
              <Badge
                tone={
                  contract.signed
                    ? 'complete'
                    : contract.canUpload
                      ? 'pending'
                      : 'neutral'
                }
              >
                {contract.signed
                  ? 'Unterschrieben'
                  : contract.canUpload
                    ? 'Unterschrift offen'
                    : 'Keine Unterschrift erforderlich'}
              </Badge>
            </div>
            <div className="ui-request-document-row">
              <Icon name="File" size={23} />
              <div>
                <h4>Originalvertrag</h4>
                <p>
                  Von der Agentur bereitgestellt ·{' '}
                  {new Date(
                    contract.createdAt,
                  ).toLocaleDateString('de-DE')}
                </p>
              </div>
              <FileDownloadButton
                url={`${url}/download?id=${contract.id}`}
                fileName="Auftragsvertrag.pdf"
              />
            </div>
            <div className="ui-request-document-row">
              <Icon
                name={contract.signed ? 'FileCheck' : 'Pen'}
                size={23}
              />
              <div>
                <h4>Unterschriebene Fassung</h4>
                <p>
                  {contract.signed
                    ? 'Ihr unterschriebener Vertrag ist hinterlegt.'
                    : 'Vertrag herunterladen, unterschreiben und als PDF hochladen.'}
                </p>
              </div>
              {contract.signed ? (
                <FileDownloadButton
                  url={`${url}/download?id=${contract.id}&version=signed`}
                  fileName="Vertrag-unterschrieben.pdf"
                />
              ) : (
                contract.canUpload && (
                  <Button
                    size="sm"
                    icon="Upload"
                    onClick={() => setUpload(contract)}
                  >
                    PDF hochladen
                  </Button>
                )
              )}
            </div>
          </section>
        ))
      )}
      {upload && (
        <RequestFileDialog
          url={`${url}/upload`}
          fields={{ contractId: upload.id }}
          onClose={() => setUpload(null)}
          onSaved={() => {
            setUpload(null);
            setNotice(
              'Ihr unterschriebener Vertrag wurde erfolgreich hinterlegt.',
            );
            refresh();
          }}
        />
      )}
    </div>
  );
}
