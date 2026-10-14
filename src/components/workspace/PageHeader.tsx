import { ReactNode } from 'react';
import Icon from '../base/Icon';

export default function PageHeader({
  title,
  subtitle,
  actions,
  onBack,
  backLabel = 'Back',
  eyebrow,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  eyebrow?: string;
}) {
  return (
    <div className="ui-page-header">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="ui-back-link"
        >
          <Icon
            name="ArrowRight"
            size={16}
            className="rotate-180"
          />
          {backLabel}
        </button>
      )}
      <div className="ui-page-heading">
        <div className="min-w-0 flex-1 max-w-full">
          {eyebrow && (
            <p className="ui-eyebrow">{eyebrow}</p>
          )}
          <h1
            className={
              typeof title === 'string'
                ? 'truncate'
                : undefined
            }
            title={
              typeof title === 'string' ? title : undefined
            }
          >
            {title}
          </h1>
          {subtitle && (
            <div
              className="ui-page-description"
              title={
                typeof subtitle === 'string'
                  ? subtitle
                  : undefined
              }
            >
              {subtitle}
            </div>
          )}
        </div>
        {actions && (
          <div className="ui-page-actions">{actions}</div>
        )}
      </div>
    </div>
  );
}
