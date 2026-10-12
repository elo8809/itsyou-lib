import type { ChatDetail, ChatLocale } from './types';
/** Request-based creation uses the same form and validation as the chat editor. */
export default function ChatCreatePage({ apiBaseUrl, clientRequestId, locale, onCancel, onCreated, onOpenChat, }: {
    apiBaseUrl: string;
    clientRequestId: string;
    locale?: ChatLocale;
    onCancel: () => void;
    onCreated: (chat: ChatDetail) => void;
    /** Opens the request's existing group chat. */
    onOpenChat: (chatId: string) => void;
}): import("react/jsx-runtime").JSX.Element;
