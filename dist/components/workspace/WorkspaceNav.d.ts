import { WorkspaceNav as Navigation } from './navigation';
export default function WorkspaceNav({ nav, selectedPath, close, label, showGroupLabels, }: {
    nav: Navigation;
    selectedPath: string;
    close?: () => void;
    label?: string;
    showGroupLabels?: boolean;
}): import("react/jsx-runtime").JSX.Element;
