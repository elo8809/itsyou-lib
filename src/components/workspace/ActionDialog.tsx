import { ReactNode } from 'react';
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
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  busy?: boolean;
  closeLabel?: string;
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
        <DialogPanel className="ui-action-dialog-panel">
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
            <div className="ui-action-dialog-content">
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
