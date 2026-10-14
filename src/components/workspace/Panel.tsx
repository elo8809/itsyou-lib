import {
  HTMLAttributes,
  ReactNode,
  useId,
  useState,
} from 'react';
import classNames from 'classnames/dedupe';
import Icon from '../base/Icon';
export interface PanelProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'title'
> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  contentClassName?: string;
  collapsible?: boolean;
  collapseLabel?: string;
  defaultCollapsed?: boolean;
  unpadded?: boolean;
}
export default function Panel({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  collapsible,
  collapseLabel = 'Toggle section',
  defaultCollapsed = false,
  unpadded = false,
  ...rest
}: PanelProps) {
  const [collapsed, setCollapsed] = useState(
    defaultCollapsed,
  );
  const id = useId();
  return (
    <section
      {...rest}
      className={classNames('ui-panel', className)}
    >
      {(title || description || actions || collapsible) && (
        <div className="ui-panel-header">
          <div className="min-w-0 flex-1">
            {typeof title === 'string' ? (
              <h2 className="truncate" title={title}>
                {title}
              </h2>
            ) : (
              title
            )}
            {description && (
              <p className="ui-panel-description">
                {description}
              </p>
            )}
          </div>
          {actions}
          {collapsible && (
            <button
              type="button"
              className="ui-icon-button"
              onClick={() =>
                setCollapsed((value) => !value)
              }
              aria-expanded={!collapsed}
              aria-controls={id}
              aria-label={collapseLabel}
            >
              <Icon
                name="ChevronDown"
                size={18}
                className={!collapsed ? 'rotate-180' : ''}
              />
            </button>
          )}
        </div>
      )}
      <div
        id={id}
        hidden={collapsible && collapsed}
        className={classNames(
          !unpadded && 'ui-panel-content',
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
