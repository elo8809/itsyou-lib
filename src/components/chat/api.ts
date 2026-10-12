import type {
  ChatDetail,
  ChatDraft,
  ChatMessage,
  ChatPerson,
  ChatRequest,
  ChatRequestDraft,
  ChatSummary,
  ChatViewer,
} from './types';

export class ChatApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function createChatApi(baseUrl: string) {
  async function request<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined)
        query.set(key, String(value));
    });
    const response = await fetch(
      `${baseUrl.replace(/\/$/, '')}/chats${path}${query.size ? `?${query}` : ''}`,
      {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'include',
        cache: 'no-store',
        signal,
        ...(body === undefined
          ? {}
          : {
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
            }),
      },
    );
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ChatApiError(
        data?.message ||
          'Unable to load chat. Please try again.',
        response.status,
      );
    }
    return response.json();
  }
  return {
    list: (
      q: string,
      cursor?: string,
      signal?: AbortSignal,
      clientRequestId?: string,
    ) =>
      request<{
        viewer: ChatViewer;
        items: ChatSummary[];
        nextCursor: string | null;
      }>(
        '',
        { q, cursor, clientRequestId },
        undefined,
        signal,
      ),
    detail: (id: string, signal?: AbortSignal) =>
      request<ChatDetail>(
        '/detail',
        { id },
        undefined,
        signal,
      ),
    directory: (
      q: string,
      role?: string,
      cursor?: string,
      signal?: AbortSignal,
    ) =>
      request<{
        items: ChatPerson[];
        nextCursor: string | null;
      }>(
        '/participants',
        { q, role, cursor },
        undefined,
        signal,
      ),
    requests: (
      q: string,
      cursor?: string,
      signal?: AbortSignal,
    ) =>
      request<{
        items: ChatRequest[];
        nextCursor: string | null;
      }>('/requests', { q, cursor }, undefined, signal),
    requestDraft: (
      clientRequestId: string,
      signal?: AbortSignal,
    ) =>
      request<ChatRequestDraft>(
        '/request-draft',
        { clientRequestId },
        undefined,
        signal,
      ),
    create: (draft: ChatDraft) =>
      request<ChatDetail>('', undefined, draft),
    update: (
      id: string,
      revision: number,
      draft: ChatDraft,
    ) =>
      request<ChatDetail>('/update', undefined, {
        ...draft,
        id,
        revision,
      }),
    messages: (
      chatId: string,
      position: { before?: number; after?: number } = {},
      signal?: AbortSignal,
    ) =>
      request<{ items: ChatMessage[]; hasMore: boolean }>(
        '/messages',
        { chatId, ...position },
        undefined,
        signal,
      ),
    send: (
      chatId: string,
      body: string,
      clientMessageId: string,
    ) =>
      request<ChatMessage>('/messages', undefined, {
        chatId,
        body,
        clientMessageId,
      }),
    read: (chatId: string, sequence: number) =>
      request<{ ok: true }>('/read', undefined, {
        chatId,
        sequence,
      }),
  };
}
export type ChatApi = ReturnType<typeof createChatApi>;
