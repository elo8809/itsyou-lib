import type { ChatLocale, ChatGrouping } from './types';
/** Shared messaging feature. The API remains the authority for all permissions. */
export default function ChatWorkspace({ apiBaseUrl, locale, allowManagement, grouping, clientRequestId, embedded, selectedChatId, onSelectChat, }: {
    apiBaseUrl: string;
    locale?: ChatLocale;
    allowManagement?: boolean;
    grouping?: ChatGrouping;
    clientRequestId?: string;
    embedded?: boolean;
    selectedChatId?: string;
    onSelectChat?: (id: string | undefined) => void;
}): import("react/jsx-runtime").JSX.Element;
