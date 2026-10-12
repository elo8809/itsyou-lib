import { ReactNode } from 'react';
export default function ChoiceChips({ label, options, value, onChange, disabled, }: {
    label: string;
    options: {
        value: string;
        label: ReactNode;
    }[];
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
}): import("react/jsx-runtime").JSX.Element;
