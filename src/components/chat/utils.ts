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
  return [
    ...new Map(
      [...current, ...incoming].map((message) => [
        message.id,
        message,
      ]),
    ).values(),
  ].sort((a, b) => a.sequence - b.sequence);
}
