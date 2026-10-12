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
        <div className="min-w-0">
          {eyebrow && (
            <p className="ui-eyebrow">{eyebrow}</p>
          )}
          <h1>{title}</h1>
          {subtitle && (
            <div className="ui-page-description">
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
