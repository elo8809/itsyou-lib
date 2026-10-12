import type { ChatDetail, ChatDraft, ChatMessage, ChatPerson, ChatRequest, ChatRequestDraft, ChatSummary, ChatViewer } from './types';
export declare class ChatApiError extends Error {
    status: number;
    constructor(message: string, status: number);
}
export declare function createChatApi(baseUrl: string): {
    list: (q: string, cursor?: string, signal?: AbortSignal, clientRequestId?: string) => Promise<{
        viewer: ChatViewer;
        items: ChatSummary[];
        nextCursor: string | null;
    }>;
    detail: (id: string, signal?: AbortSignal) => Promise<ChatDetail>;
    directory: (q: string, role?: string, cursor?: string, signal?: AbortSignal) => Promise<{
        items: ChatPerson[];
        nextCursor: string | null;
    }>;
    requests: (q: string, cursor?: string, signal?: AbortSignal) => Promise<{
        items: ChatRequest[];
        nextCursor: string | null;
    }>;
    requestDraft: (clientRequestId: string, signal?: AbortSignal) => Promise<ChatRequestDraft>;
    create: (draft: ChatDraft) => Promise<ChatDetail>;
    update: (id: string, revision: number, draft: ChatDraft) => Promise<ChatDetail>;
    messages: (chatId: string, position?: {
        before?: number;
        after?: number;
    }, signal?: AbortSignal) => Promise<{
        items: ChatMessage[];
        hasMore: boolean;
    }>;
    send: (chatId: string, body: string, clientMessageId: string) => Promise<ChatMessage>;
    read: (chatId: string, sequence: number) => Promise<{
        ok: true;
    }>;
};
export type ChatApi = ReturnType<typeof createChatApi>;
