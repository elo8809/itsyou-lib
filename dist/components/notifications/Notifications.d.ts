export type NotificationProps = {
    apiBaseUrl: string;
    audience: 'admin' | 'client' | 'model';
    identity: string;
    locale?: 'en' | 'de';
    inboxHref?: string;
    pitchUrl?: (id: string) => string;
};
export declare function NotificationBell(props: NotificationProps): import("react/jsx-runtime").JSX.Element;
export declare function NotificationInbox(props: NotificationProps): import("react/jsx-runtime").JSX.Element;
