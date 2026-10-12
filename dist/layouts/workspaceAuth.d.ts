import { ReactNode } from 'react';
export interface WorkspaceAuthLayoutProps {
    children: ReactNode;
    workspaceLabel: string;
    eyebrow?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    brand?: ReactNode;
    formHeader?: ReactNode;
    storyFooter?: ReactNode;
    footer?: ReactNode;
}
export default function WorkspaceAuthLayout({ children, workspaceLabel, eyebrow, title, description, brand, formHeader, storyFooter, footer, }: WorkspaceAuthLayoutProps): import("react/jsx-runtime").JSX.Element;
