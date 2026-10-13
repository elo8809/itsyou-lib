import { ReactNode } from 'react';
import classNames from 'classnames/dedupe';
import {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import Icon from '../base/Icon';
export default function ActionDialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  busy,
  closeLabel = 'Close',
  size = 'sm',
  contentClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  busy?: boolean;
  closeLabel?: string;
  size?: 'sm' | 'lg' | 'xl';
  contentClassName?: string;
}) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      className="ui-action-dialog"
    >
      <DialogBackdrop className="ui-dialog-backdrop" />
      <div className="ui-action-dialog-container">
        <DialogPanel
          className="ui-action-dialog-panel"
          data-size={size}
          aria-busy={busy || undefined}
        >
          <div className="ui-action-dialog-header">
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>
                  {description}
                </DialogDescription>
              )}
            </div>
            <button
              type="button"
              className="ui-icon-button"
              disabled={busy}
              onClick={onClose}
              aria-label={closeLabel}
            >
              <Icon name="Close" size={18} />
            </button>
          </div>
          {children && (
            <div
              className={classNames(
                'ui-action-dialog-content',
                contentClassName,
              )}
            >
              {children}
            </div>
          )}
          {actions && (
            <div className="ui-action-dialog-actions">
              {actions}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
