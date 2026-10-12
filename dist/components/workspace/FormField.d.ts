import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
export declare const inputClass = "ui-input";
export declare function FormField({ label, hint, error, className, children, }: {
    label: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    className?: string;
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare const TextInput: import("react").ForwardRefExoticComponent<InputHTMLAttributes<HTMLInputElement> & import("react").RefAttributes<HTMLInputElement>>;
export interface SelectOption {
    id: string | number;
    label: ReactNode;
}
export declare const Select: import("react").ForwardRefExoticComponent<SelectHTMLAttributes<HTMLSelectElement> & {
    items: SelectOption[];
    placeholder?: string;
} & import("react").RefAttributes<HTMLSelectElement>>;
export declare function FormCard({ id, title, description, children, }: {
    id?: string;
    title: string;
    description?: string;
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
