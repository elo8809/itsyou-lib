import type { ChatGrouping, ChatLocale, ChatSummary } from './types';
import type { ChatLabels } from './labels';
export default function ChatConversationList({ chats, grouping, selected, onSelect, locale, labels: t, search, }: {
    chats: ChatSummary[];
    grouping: ChatGrouping;
    selected?: string;
    onSelect: (id: string) => void;
    locale: ChatLocale;
    labels: ChatLabels;
    search: string;
}): import("react/jsx-runtime").JSX.Element;
