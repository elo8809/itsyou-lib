import { HTMLAttributes, ReactNode } from 'react';
export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    contentClassName?: string;
    collapsible?: boolean;
    collapseLabel?: string;
    defaultCollapsed?: boolean;
    unpadded?: boolean;
}
export default function Panel({ title, description, actions, children, className, contentClassName, collapsible, collapseLabel, defaultCollapsed, unpadded, ...rest }: PanelProps): import("react/jsx-runtime").JSX.Element;
