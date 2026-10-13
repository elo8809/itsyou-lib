import React, { useState } from 'react';
import Button, { ButtonProps } from './Button';
import { ConfirmDialog } from '../workspace/ConfirmDialog';

interface Props extends ButtonProps {
  children?: string;
  errors?: unknown;
  Element?: React.ElementType;
  action?: string;
}

/** Compatibility adapter: existing actions use the shared confirmation flow. */
const ButtonSubmit = ({
  children,
  onClick,
  action,
  Element = Button,
  type: _type,
  errors: _errors,
  ...rest
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const label = action || children || 'Confirm';
  return (
    <>
      <Element
        {...rest}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        {children}
      </Element>
      <ConfirmDialog
        config={
          isOpen
            ? {
                title: `${label}?`,
                confirmLabel: label,
                run: (event) => onClick?.(event),
              }
            : null
        }
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default ButtonSubmit;
