export type NotificationProps = {
    apiBaseUrl: string;
    audience: 'admin' | 'client' | 'model';
    identity: string;
    locale?: 'en' | 'de';
    inboxHref?: string;
    pitchUrl?: (id: string) => string;
    /** Overrides the hint under the empty state, e.g. what will show up here. */
    emptyHint?: string;
};
export declare function NotificationBell(props: NotificationProps): import("react/jsx-runtime").JSX.Element;
export declare function NotificationInbox(props: NotificationProps): import("react/jsx-runtime").JSX.Element;
