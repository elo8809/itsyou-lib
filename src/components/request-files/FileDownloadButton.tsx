import { useState } from 'react';
import Button from '../base/Button';
export default function FileDownloadButton({
  url,
  fileName,
  label = 'Herunterladen',
}: {
  url: string;
  fileName: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="ui-request-download">
      <Button
        variant="secondary"
        size="sm"
        icon="Download"
        isLoading={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            const response = await fetch(url, {
              credentials: 'include',
              cache: 'no-store',
            });
            if (!response.ok) {
              const data = await response
                .json()
                .catch(() => null);
              throw new Error(
                data?.message ||
                  'Download fehlgeschlagen. Bitte erneut versuchen.',
              );
            }
            const objectUrl = URL.createObjectURL(
              await response.blob(),
            );
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(
              () => URL.revokeObjectURL(objectUrl),
              60000,
            );
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : 'Download fehlgeschlagen.',
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {label}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
