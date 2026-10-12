import type { ChatRequest, ChatSummary } from './types';
export type ChatClientGroup = {
    id: string;
    client: ChatRequest['client'] | null;
    chats: ChatSummary[];
};
export declare function groupConversations(chats: ChatSummary[]): ChatClientGroup[];
