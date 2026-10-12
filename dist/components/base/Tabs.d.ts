import { ReactNode } from 'react';
interface Props {
    items: {
        name: string;
        panel: ReactNode;
        count?: number;
    }[];
    variant?: 'segmented' | 'underline';
    label?: string;
    selectedIndex?: number;
    onChange?: (index: number) => void;
    /** Preserve forms and drafts while switching between panels. */
    keepMounted?: boolean;
    listClassName?: string;
    wrapperClassName?: string;
    listWrapperClassName?: string;
    buttonClassName?: string;
    selectedClassName?: string;
}
export default function Tabs({ items, listClassName, buttonClassName, listWrapperClassName, selectedClassName, wrapperClassName, variant, label, selectedIndex, onChange, keepMounted, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
