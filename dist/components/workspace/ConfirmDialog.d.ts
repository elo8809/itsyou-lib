import { MouseEvent, ReactNode } from 'react';
import { ButtonProps } from '../base/Button';
export type ConfirmConfig = {
    title: ReactNode;
    description?: ReactNode;
    confirmLabel: string;
    /** Reject on failure to keep the dialog open with an inline error. */
    run: (event: MouseEvent<HTMLButtonElement>) => unknown | Promise<unknown>;
};
export type ConfirmDialogProps = {
    config: ConfirmConfig | null;
    onClose: () => void;
    locale?: 'en' | 'de';
    cancelLabel?: string;
};
export declare function ConfirmDialog(props: ConfirmDialogProps): import("react/jsx-runtime").JSX.Element;
export type ConfirmButtonProps = ConfirmConfig & Omit<ButtonProps, 'title' | 'onClick' | 'href' | 'type'> & Pick<ConfirmDialogProps, 'locale' | 'cancelLabel'>;
export declare function ConfirmButton({ title, description, confirmLabel, run, locale, cancelLabel, ...buttonProps }: ConfirmButtonProps): import("react/jsx-runtime").JSX.Element;
