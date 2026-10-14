import { useEffect, useId, useState } from 'react';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';
import Icon from '../base/Icon';

export interface ContactLabels {
  title: string;
  email: string;
  phone: string;
  copy: string;
  copied: string;
  copyError: string;
  close: string;
  unavailable: string;
}
const defaultLabels: ContactLabels = {
  title: 'Contact details',
  email: 'Email',
  phone: 'Phone',
  copy: 'Copy',
  copied: 'Copied',
  copyError: 'Could not copy. Select and copy the text.',
  close: 'Close contact details',
  unavailable: 'Not provided',
};

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  errorLabel = defaultLabels.copyError,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  errorLabel?: string;
}) {
  const [status, setStatus] = useState<
    'idle' | 'copied' | 'error'
  >('idle');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    setStatus('idle');
  }, [value]);
  useEffect(() => {
    if (status !== 'copied') return;
    const timer = setTimeout(() => setStatus('idle'), 2200);
    return () => clearTimeout(timer);
  }, [status]);
  const copy = async () => {
    setPending(true);
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('error');
    } finally {
      setPending(false);
    }
  };
  return (
    <span className="ui-copy-control">
      <button
        type="button"
        className="ui-copy-button"
        onClick={copy}
        disabled={pending}
        aria-label={label}
        title={label}
      >
        <Icon
          name={status === 'copied' ? 'Success' : 'Copy'}
          size={15}
          aria-hidden="true"
        />
        <span>
          {status === 'copied'
            ? copiedLabel
            : label.split(' ')[0]}
        </span>
      </button>
      <span
        className={
          status === 'error' ? 'ui-copy-error' : 'sr-only'
        }
        role="status"
      >
        {status === 'copied'
          ? copiedLabel
          : status === 'error'
            ? errorLabel
            : ''}
      </span>
    </span>
  );
}

export interface ContactDetailsProps {
  name?: string;
  showMissing?: boolean;
  email?: string | null;
  phone?: string | null;
  labels?: Partial<ContactLabels>;
}
export function ContactDetails({
  email,
  phone,
  labels: customLabels,
  showMissing = true,
}: ContactDetailsProps) {
  const labels = { ...defaultLabels, ...customLabels };
  return (
    <div className="ui-contact-details">
      {[
        {
          label: labels.email,
          value: email,
          icon: 'Mail' as const,
          href: email
            ? `mailto:${email.trim()}`
            : undefined,
        },
        {
          label: labels.phone,
          value: phone,
          icon: 'Phone' as const,
          href: phone
            ? `tel:${phone.replace(/[^+\d]/g, '')}`
            : undefined,
        },
      ]
        .filter((item) => showMissing || !!item.value)
        .map(({ label, value, icon, href }) => (
          <div className="ui-contact-row" key={icon}>
            <div className="ui-contact-value">
              <span className="ui-contact-label">
                <Icon
                  name={icon}
                  size={14}
                  aria-hidden="true"
                />
                {label}
              </span>
              {value ? (
                <a href={href}>{value}</a>
              ) : (
                <span className="ui-contact-missing">
                  {labels.unavailable}
                </span>
              )}
            </div>
            {value && (
              <CopyButton
                value={value}
                label={`${labels.copy} ${label.toLowerCase()}`}
                copiedLabel={labels.copied}
                errorLabel={labels.copyError}
              />
            )}
          </div>
        ))}
    </div>
  );
}

export function ContactPopover({
  name,
  email,
  phone,
  labels: customLabels,
}: ContactDetailsProps) {
  const labels = { ...defaultLabels, ...customLabels };
  const titleId = useId();
  if (!email && !phone)
    return (
      <span
        className="ui-contact-missing"
        aria-label={labels.unavailable}
      >
        —
      </span>
    );
  return (
    <Popover className="ui-contact-popover">
      <PopoverButton
        className="ui-contact-trigger"
        aria-label={`${labels.title}${name ? ` · ${name}` : ''}`}
        title={labels.title}
      >
        {email && (
          <Icon name="Mail" size={17} aria-hidden="true" />
        )}
        {phone && (
          <Icon name="Phone" size={17} aria-hidden="true" />
        )}
        <Icon
          name="ChevronDown"
          size={12}
          aria-hidden="true"
        />
      </PopoverButton>
      <PopoverPanel
        anchor="bottom end"
        portal
        focus
        className="ui-contact-panel"
        role="dialog"
        aria-labelledby={titleId}
      >
        {({ close }) => (
          <>
            <div className="ui-contact-header">
              <div className="min-w-0 flex-1">
                <h2 id={titleId}>{labels.title}</h2>
                {name && (
                  <p className="truncate" title={name}>
                    {name}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="ui-icon-button"
                onClick={() => close()}
                aria-label={labels.close}
              >
                <Icon name="Close" size={17} />
              </button>
            </div>
            <ContactDetails
              email={email}
              phone={phone}
              labels={labels}
            />
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
