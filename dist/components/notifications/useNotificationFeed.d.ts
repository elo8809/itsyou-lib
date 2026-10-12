export type NotificationItem = {
    id: string;
    kind: string;
    title: string;
    description: string;
    createdAt: string;
    read: boolean;
    resolved: boolean;
    href: string;
    pitchId?: string | null;
};
type Feed = {
    items: NotificationItem[];
    unreadCount: number;
    openCount: number;
    nextCursor: string | null;
    asOf: string;
};
export default function useNotificationFeed(url: string, identity: string, filter: string): {
    feed: Feed;
    error: boolean;
    actionError: boolean;
    busy: string;
    loading: boolean;
    refresh: () => void;
    more: () => void;
    act: (operation: "read" | "resolve", target: {
        id: string;
    } | {
        before: string;
    }) => Promise<void>;
};
export {};
