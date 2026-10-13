import {
  MouseEvent,
  ReactNode,
  useRef,
  useState,
} from 'react';
import Button, { ButtonProps } from '../base/Button';
import ActionDialog from './ActionDialog';
import { InlineNotice } from './Feedback';

export type ConfirmConfig = {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  /** Reject on failure to keep the dialog open with an inline error. */
  run: (
    event: MouseEvent<HTMLButtonElement>,
  ) => unknown | Promise<unknown>;
};

export type ConfirmDialogProps = {
  config: ConfirmConfig | null;
  onClose: () => void;
  locale?: 'en' | 'de';
  cancelLabel?: string;
};

const labels = {
  en: {
    cancel: 'Cancel',
    close: 'Close',
    error: 'Something went wrong. Please try again.',
  },
  de: {
    cancel: 'Abbrechen',
    close: 'Schließen',
    error:
      'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  },
};

// Each opening gets fresh state, including after a parent closes the dialog.
export function ConfirmDialog(props: ConfirmDialogProps) {
  return props.config ? (
    <Confirmation {...props} config={props.config} />
  ) : null;
}

function Confirmation({
  config,
  onClose,
  locale = 'en',
  cancelLabel,
}: ConfirmDialogProps & { config: ConfirmConfig }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(false);
  const copy = labels[locale];
  const close = () => {
    if (!running.current) onClose();
  };
  const confirm = async (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    // Also guard clicks made before React has rendered the disabled button.
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await config.run(event);
    } catch (err: unknown) {
      const failure = err as {
        response?: { data?: { message?: unknown } };
        message?: unknown;
      } | null;
      const message =
        failure?.response?.data?.message ||
        failure?.message;
      setError(
        typeof message === 'string' ? message : copy.error,
      );
      return;
    } finally {
      running.current = false;
      setBusy(false);
    }
    onClose();
  };

  return (
    <ActionDialog
      open
      onClose={close}
      busy={busy}
      title={config.title}
      description={config.description}
      closeLabel={copy.close}
      actions={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={close}
            disabled={busy}
            data-autofocus
          >
            {cancelLabel || copy.cancel}
          </Button>
          <Button
            type="button"
            onClick={confirm}
            isLoading={busy}
          >
            {config.confirmLabel}
          </Button>
        </>
      }
    >
      {error ? (
        <InlineNotice tone="error">{error}</InlineNotice>
      ) : null}
    </ActionDialog>
  );
}

export type ConfirmButtonProps = ConfirmConfig &
  Omit<ButtonProps, 'title' | 'onClick' | 'href' | 'type'> &
  Pick<ConfirmDialogProps, 'locale' | 'cancelLabel'>;

export function ConfirmButton({
  title,
  description,
  confirmLabel,
  run,
  locale,
  cancelLabel,
  ...buttonProps
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        {...buttonProps}
        type="button"
        onClick={() => setOpen(true)}
      />
      <ConfirmDialog
        config={
          open
            ? { title, description, confirmLabel, run }
            : null
        }
        onClose={() => setOpen(false)}
        locale={locale}
        cancelLabel={cancelLabel}
      />
    </>
  );
}
