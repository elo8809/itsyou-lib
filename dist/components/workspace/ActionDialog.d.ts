import { ReactNode } from 'react';
export default function ActionDialog({ open, onClose, title, description, children, actions, busy, closeLabel, }: {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    actions?: ReactNode;
    busy?: boolean;
    closeLabel?: string;
}): import("react/jsx-runtime").JSX.Element;
