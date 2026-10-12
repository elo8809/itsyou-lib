import type { ChatRequest, ChatSummary } from './types';
export type ChatClientGroup = {
  id: string;
  client: ChatRequest['client'] | null;
  chats: ChatSummary[];
};

// Preserve activity order; IDs keep equally named clients separate.
export function groupConversations(
  chats: ChatSummary[],
): ChatClientGroup[] {
  const clients = new Map<string, ChatClientGroup>();
  for (const chat of chats) {
    const client = chat.request?.client || null;
    const id = client?.id || 'general';
    let group = clients.get(id);
    if (!group) {
      group = { id, client, chats: [] };
      clients.set(id, group);
    }
    group.chats.push(chat);
  }
  return [...clients.values()];
}
