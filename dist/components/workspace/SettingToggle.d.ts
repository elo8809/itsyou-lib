import { ReactNode } from 'react';
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
export default function SettingToggle({ label, description, checked, onChange, disabled, busy, className, }: SettingToggleProps): import("react/jsx-runtime").JSX.Element;
