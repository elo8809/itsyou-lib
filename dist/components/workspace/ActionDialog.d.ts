import { ReactNode } from 'react';
export default function ActionDialog({ open, onClose, title, description, children, actions, busy, closeLabel, size, contentClassName, }: {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    actions?: ReactNode;
    busy?: boolean;
    closeLabel?: string;
    size?: 'sm' | 'lg' | 'xl';
    contentClassName?: string;
}): import("react/jsx-runtime").JSX.Element;
