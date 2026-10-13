import type { ChatRequest, ChatSummary } from './types';
export type ChatClientGroup = {
  id: string;
  client: ChatRequest['client'] | null;
  chats: ChatSummary[];
};

export type ChatCategory =
  | 'project'
  | 'general-client'
  | 'general-model'
  | 'general';

export function groupConversationsByCategory(
  chats: ChatSummary[],
  grouping: 'category' | 'kind' = 'category',
): { id: ChatCategory; chats: ChatSummary[] }[] {
  const categories: Record<ChatCategory, ChatSummary[]> = {
    project: [],
    'general-client': [],
    'general-model': [],
    general: [],
  };
  for (const chat of chats) {
    if (chat.kind !== 'GENERAL') {
      categories.project.push(chat);
    } else if (grouping === 'kind') {
      categories.general.push(chat);
    } else if (chat.owner?.role === 'CLIENT') {
      categories['general-client'].push(chat);
    } else if (chat.owner?.role === 'USER') {
      categories['general-model'].push(chat);
    } else {
      // Keep chats from removed or reassigned accounts accessible.
      categories.general.push(chat);
    }
  }
  const order: ChatCategory[] =
    grouping === 'kind'
      ? ['general', 'project']
      : [
          'project',
          'general-client',
          'general-model',
          'general',
        ];
  return order
    .filter((id) => categories[id].length > 0)
    .map((id) => ({ id, chats: categories[id] }));
}

// Preserve activity order; IDs keep equally named clients separate.
export function groupConversations(
  chats: ChatSummary[],
): ChatClientGroup[] {
  const clients = new Map<string, ChatClientGroup>();
  for (const chat of chats) {
    const client =
      chat.request?.client ||
      (chat.owner?.client?.id
        ? {
            id: chat.owner.client.id,
            name: chat.owner.client.name,
          }
        : null);
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
