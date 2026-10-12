import type { ChatDetail, ChatLocale } from './types';
/** Request-based creation uses the same form and validation as the chat editor. */
export default function ChatCreatePage({ apiBaseUrl, clientRequestId, locale, onCancel, onCreated, }: {
    apiBaseUrl: string;
    clientRequestId: string;
    locale?: ChatLocale;
    onCancel: () => void;
    onCreated: (chat: ChatDetail) => void;
}): import("react/jsx-runtime").JSX.Element;
