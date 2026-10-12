import { ReactNode } from 'react';
import Link from 'next/link';
import Icon, { IconType } from '../base/Icon';
import { Skeleton } from './Feedback';
export default function MetricCard({
  label,
  value,
  prefix,
  description,
  icon,
  href,
  loading,
  unavailable,
  linkLabel,
}: {
  label: string;
  value: ReactNode;
  prefix?: ReactNode;
  description?: ReactNode;
  icon?: IconType;
  href?: string;
  loading?: boolean;
  unavailable?: boolean;
  linkLabel?: string;
}) {
  const content = (
    <>
      <div className="ui-stat-top">
        <span>{label}</span>
        {icon && (
          <Icon name={icon} size={19} aria-hidden="true" />
        )}
      </div>
      <div className="ui-stat-value">
        {loading ? (
          <Skeleton className="ui-stat-skeleton" />
        ) : unavailable ? (
          '—'
        ) : (
          <>
            {prefix && (
              <span className="ui-stat-currency">
                {prefix}
              </span>
            )}
            {value}
          </>
        )}
      </div>
      <div className="ui-stat-bottom">
        <span>{description}</span>
        {href && (
          <Icon
            name="ArrowRight"
            size={16}
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );
  return href ? (
    <Link
      href={href}
      className="ui-stat-card"
      aria-label={linkLabel}
      aria-busy={loading}
    >
      {content}
    </Link>
  ) : (
    <div className="ui-stat-card" aria-busy={loading}>
      {content}
    </div>
  );
}
