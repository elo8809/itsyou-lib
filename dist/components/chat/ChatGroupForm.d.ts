import type { ChatApi } from './api';
import type { ChatDetail, ChatGroupDefaults, ChatViewer } from './types';
import type { ChatLabels } from './labels';
export default function ChatGroupForm({ api, viewer, chat, initialValues, presentation, lockRequest, labels: t, onClose, onSaved, }: {
    api: ChatApi;
    viewer: ChatViewer;
    chat?: ChatDetail;
    initialValues?: ChatGroupDefaults;
    presentation?: 'dialog' | 'page';
    lockRequest?: boolean;
    labels: ChatLabels;
    onClose: () => void;
    onSaved: (chat: ChatDetail) => void;
}): import("react/jsx-runtime").JSX.Element;
