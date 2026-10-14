import { ReactNode } from 'react';
import { type WorkspaceAttention } from '../components/workspace/useAttentionCounts';
import { WorkspaceNav as Navigation, WorkspaceLabels } from '../components/workspace/navigation';
export interface WorkspaceLayoutProps {
    children: ReactNode;
    nav: Navigation;
    attention?: WorkspaceAttention;
    currentPath: string;
    navigationKey?: string;
    busy?: boolean;
    onNavigate: (href: string) => void;
    account?: {
        name: string;
        email?: string | null;
        role?: string;
        settingsHref?: string;
        viewAs?: {
            label: string;
            value: string;
            options: {
                value: string;
                label: string;
            }[];
            onChange: (value: string) => void;
        };
        onSignOut?: () => void;
    };
    workspaceName: string;
    workspaceDescription?: string;
    brand?: ReactNode;
    brandSubtitle?: string;
    homeHref?: string;
    contentClassName?: string;
    sidebarFooter?: ReactNode;
    /** Navigation pinned below the scrollable menu and above sign out. */
    sidebarBottomNav?: Navigation;
    /** Pin the account's sign-out action below the scrollable navigation. */
    sidebarSignOut?: boolean;
    footer?: ReactNode;
    headerActions?: ReactNode;
    labels?: Partial<WorkspaceLabels>;
}
export default function WorkspaceLayout({ children, nav, attention, currentPath, navigationKey, busy, onNavigate, account, workspaceName, workspaceDescription, brand, brandSubtitle, homeHref, contentClassName, sidebarFooter, sidebarBottomNav, sidebarSignOut, footer, headerActions, labels: customLabels, }: WorkspaceLayoutProps): import("react/jsx-runtime").JSX.Element;
