import { IconType } from './Icon';
import type { AttentionKey } from '../workspace/useAttentionCounts';
export type NavEntry = {
    name: string;
    href: string;
    icon: IconType;
    attentionKey?: AttentionKey;
    children?: NavEntry[];
};
export type TDashboardNav = Record<string, NavEntry[]>;
declare const DashboardNav: ({ nav, selectedPath, close, }: {
    nav: TDashboardNav;
    selectedPath: string;
    close?: () => void;
}) => import("react/jsx-runtime").JSX.Element;
export default DashboardNav;
