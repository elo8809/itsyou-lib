import { ReactNode } from 'react';
import Button from '../base/Button';
import { EmptyState, Skeleton } from './Feedback';

/** Keep successful content mounted during refreshes and recoverable errors. */
export default function DataRegion({
  children,
  loading,
  updating,
  error,
  hasData,
  onRetry,
  skeleton,
  locale = 'en',
  errorTitle,
  minHeight = 240,
  className = '',
}: {
  children: ReactNode;
  loading?: boolean;
  updating?: boolean;
  error?: boolean;
  hasData: boolean;
  onRetry?: () => void;
  skeleton?: ReactNode;
  locale?: 'en' | 'de';
  errorTitle?: string;
  minHeight?: number | string;
  className?: string;
}) {
  const retry =
    locale === 'de' ? 'Erneut versuchen' : 'Try again';
  const title =
    errorTitle ||
    (locale === 'de'
      ? 'Daten konnten nicht geladen werden'
      : 'Unable to load this content');
  return (
    <div
      className={`ui-data-region ${className}`}
      style={{ minHeight }}
      aria-busy={!!loading || !!updating}
    >
      {loading && !hasData ? (
        <div role="status">
          <span className="sr-only">
            {locale === 'de' ? 'Wird geladen…' : 'Loading…'}
          </span>
          {skeleton || <ListSkeleton />}
        </div>
      ) : error && !hasData ? (
        <EmptyState
          title={title}
          action={
            onRetry && (
              <Button variant="secondary" onClick={onRetry}>
                {retry}
              </Button>
            )
          }
        />
      ) : (
        children
      )}
      {error && hasData && (
        <div className="ui-refresh-notice" role="status">
          <span>
            {locale === 'de'
              ? 'Aktualisierung fehlgeschlagen. Der letzte geladene Stand bleibt sichtbar.'
              : 'Couldn’t refresh. Showing the last loaded version.'}
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={updating}
            >
              {retry}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ListSkeleton({
  rows = 5,
  rowHeight = 80,
}: {
  rows?: number;
  rowHeight?: number;
}) {
  return (
    <div className="ui-list-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="ui-list-skeleton-row"
          style={{ minHeight: rowHeight }}
          key={index}
        >
          <Skeleton className="ui-list-skeleton-avatar" />
          <div>
            <Skeleton className="ui-list-skeleton-title" />
            <Skeleton className="ui-list-skeleton-detail" />
          </div>
          <Skeleton className="ui-list-skeleton-action" />
        </div>
      ))}
    </div>
  );
}
