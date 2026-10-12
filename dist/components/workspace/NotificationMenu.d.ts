import { ReactNode } from 'react';
export interface NotificationMenuProps {
    label?: string;
    unreadCount: number;
    children: (close: () => void) => ReactNode;
}
/** Accessible notification surface; each app supplies its feed and actions. */
export default function NotificationMenu({ label, unreadCount, children, }: NotificationMenuProps): import("react/jsx-runtime").JSX.Element;
