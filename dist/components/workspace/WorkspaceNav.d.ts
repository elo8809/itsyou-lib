import { WorkspaceNav as Navigation } from './navigation';
export default function WorkspaceNav({ nav, selectedPath, close, label, }: {
    nav: Navigation;
    selectedPath: string;
    close?: () => void;
    label?: string;
}): import("react/jsx-runtime").JSX.Element;
