import type { ChatMessage, ChatRole } from './types';
import type { ChatLabels } from './labels';
export function roleLabel(
  role: ChatRole,
  labels: ChatLabels,
) {
  return {
    ADMIN: labels.admin,
    MEMBER: labels.member,
    CLIENT: labels.client,
    USER: labels.model,
    REMOVED: labels.removed,
  }[role];
}
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
export function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
) {
  const messages = new Map(
    current.map((message) => [message.id, message]),
  );
  for (const message of incoming) {
    const previous = messages.get(message.id);
    if (
      !previous ||
      (message.editSequence || 0) >=
        (previous.editSequence || 0)
    )
      messages.set(message.id, message);
  }
  return [...messages.values()].sort(
    (a, b) => a.sequence - b.sequence,
  );
}
