import { ReactNode } from 'react';
import { TDashboardNav } from '../components/base/DashboardNav';
interface Props {
    children: React.ReactNode;
    nav: TDashboardNav;
    contentClassName?: string;
    currentPath: string;
    sidebarFooter?: ReactNode;
}
export default function DashboardLayout({ children, nav, contentClassName, currentPath, sidebarFooter, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
