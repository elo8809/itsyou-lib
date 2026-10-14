import type { AttentionCounts } from './useAttentionCounts';
import { WorkspaceNav as Navigation } from './navigation';
export default function WorkspaceNav({ nav, selectedPath, close, label, showGroupLabels, counts, attentionLabel, }: {
    nav: Navigation;
    selectedPath: string;
    close?: () => void;
    label?: string;
    showGroupLabels?: boolean;
    counts?: AttentionCounts;
    attentionLabel?: string;
}): import("react/jsx-runtime").JSX.Element;
