import { HTMLAttributes, ReactNode } from 'react';
import { IconType } from '../base/Icon';
export type BadgeTone = 'neutral' | 'pending' | 'complete' | 'attention';
export declare function Badge({ children, tone, dot, className, ...rest }: HTMLAttributes<HTMLSpanElement> & {
    tone?: BadgeTone;
    dot?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export declare function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
export declare function EmptyState({ title, description, children, action, icon, loading, loadingLabel, className, }: {
    title?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    action?: ReactNode;
    icon?: IconType;
    loading?: boolean;
    loadingLabel?: string;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function InlineNotice({ children, action, className, tone, }: {
    children: ReactNode;
    action?: ReactNode;
    className?: string;
    tone?: 'neutral' | 'error';
}): import("react/jsx-runtime").JSX.Element;
export declare function WorkspaceLoading({ label, }: {
    label?: string;
}): import("react/jsx-runtime").JSX.Element;
