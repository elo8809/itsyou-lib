import type { ChatMessage, ChatRole } from './types';
import type { ChatLabels } from './labels';
export declare function roleLabel(role: ChatRole, labels: ChatLabels): string;
export declare const initials: (name: string) => string;
export declare function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[];
