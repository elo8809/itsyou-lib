import { ReactNode, useId } from 'react';
import classNames from 'classnames/dedupe';

export interface SettingToggleProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}

/** A labelled, keyboard-accessible switch for an immediately saved setting. */
export default function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
  busy,
  className,
}: SettingToggleProps) {
  const id = useId();
  return (
    <div
      className={classNames('ui-setting-toggle', className)}
    >
      <div className="ui-setting-toggle-copy">
        <label id={`${id}-label`} htmlFor={id}>
          {label}
        </label>
        {description && (
          <p id={`${id}-description`}>{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={
          description ? `${id}-description` : undefined
        }
        aria-busy={busy || undefined}
        disabled={disabled || busy}
        className="ui-switch"
        onClick={() => onChange(!checked)}
      >
        <span
          className="ui-switch-track"
          aria-hidden="true"
        >
          <span />
        </span>
      </button>
    </div>
  );
}
