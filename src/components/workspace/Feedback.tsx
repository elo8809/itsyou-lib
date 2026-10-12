import { HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames/dedupe';
import Icon, { IconType } from '../base/Icon';
import Loader from '../base/Loader';
export type BadgeTone =
  | 'neutral'
  | 'pending'
  | 'complete'
  | 'attention';
export function Badge({
  children,
  tone = 'neutral',
  dot = true,
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  dot?: boolean;
}) {
  return (
    <span
      {...rest}
      className={classNames('ui-status', className)}
      data-tone={tone}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="ui-status-dot"
        />
      )}
      {children}
    </span>
  );
}
export function Skeleton({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      {...rest}
      className={classNames('ui-skeleton', className)}
    />
  );
}
export function EmptyState({
  title,
  description,
  children,
  action,
  icon = 'Inbox',
  loading,
  loadingLabel = 'Loading…',
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  icon?: IconType;
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={classNames('ui-empty-state', className)}
      role="status"
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Loader size={24} color="dark" />
          <p>{loadingLabel}</p>
        </>
      ) : (
        <>
          <span className="ui-empty-check">
            <Icon
              name={icon}
              size={24}
              aria-hidden="true"
            />
          </span>
          {title && <strong>{title}</strong>}
          {(description || children) && (
            <div>{description || children}</div>
          )}
          {action}
        </>
      )}
    </div>
  );
}
export function InlineNotice({
  children,
  action,
  className,
  tone = 'neutral',
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: 'neutral' | 'error';
}) {
  return (
    <div
      className={classNames('ui-inline-error', className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <div>{children}</div>
      {action}
    </div>
  );
}
export function WorkspaceLoading({
  label = 'Opening your workspace…',
}: {
  label?: string;
}) {
  return (
    <div className="ui-session-loading" role="status">
      <span className="ui-loading-mark" aria-hidden="true">
        iy.
      </span>
      <p>{label}</p>
    </div>
  );
}
