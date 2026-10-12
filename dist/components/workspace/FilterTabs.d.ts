import { ReactNode } from 'react';
export interface FilterOption<T extends string> {
    value: T;
    label: ReactNode;
    count?: number;
    disabled?: boolean;
}
export interface FilterTabsProps<T extends string> {
    label: string;
    value: T;
    options: FilterOption<T>[];
    onChange: (value: T) => void;
    variant?: 'segmented' | 'underline';
    className?: string;
}
/** A group of filter buttons, not an ARIA tablist: selection updates data rather than focus. */
export default function FilterTabs<T extends string>({ label, value, options, onChange, variant, className, }: FilterTabsProps<T>): import("react/jsx-runtime").JSX.Element;
