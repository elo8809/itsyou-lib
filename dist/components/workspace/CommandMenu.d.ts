import { WorkspaceLabels, WorkspaceNav } from './navigation';
export default function CommandMenu({ nav, open, onClose, onNavigate, labels: customLabels, }: {
    nav: WorkspaceNav;
    open: boolean;
    onClose: () => void;
    onNavigate: (href: string) => void;
    labels?: Partial<WorkspaceLabels>;
}): import("react/jsx-runtime").JSX.Element;
