import type { ChatRequest, ChatSummary } from './types';
export type ChatClientGroup = {
    id: string;
    client: ChatRequest['client'] | null;
    chats: ChatSummary[];
};
export type ChatCategory = 'project' | 'general-client' | 'general-model' | 'general';
export declare function groupConversationsByCategory(chats: ChatSummary[], grouping?: 'category' | 'kind'): {
    id: ChatCategory;
    chats: ChatSummary[];
}[];
export declare function groupConversations(chats: ChatSummary[]): ChatClientGroup[];
