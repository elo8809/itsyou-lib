import type { ChatApi } from './api';
import type { ChatLabels } from './labels';
import type { ChatRequest } from './types';
export default function ChatRequestPicker({ api, value, onChange, disabled, labels: t, }: {
    api: ChatApi;
    value: ChatRequest | null;
    onChange: (request: ChatRequest | null) => void;
    disabled?: boolean;
    labels: ChatLabels;
}): import("react/jsx-runtime").JSX.Element;
