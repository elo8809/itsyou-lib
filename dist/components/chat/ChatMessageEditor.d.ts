import { type ChatApi } from './api';
import type { ChatMessage } from './types';
import type { ChatLabels } from './labels';
export default function ChatMessageEditor({ api, chatId, message, labels: t, onClose, onSaved, }: {
    api: ChatApi;
    chatId: string;
    message: ChatMessage;
    labels: ChatLabels;
    onClose: () => void;
    onSaved: (message: ChatMessage) => void;
}): import("react/jsx-runtime").JSX.Element;
