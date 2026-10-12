import { ReactNode } from 'react';
import { IconType } from '../base/Icon';
export default function MetricCard({ label, value, prefix, description, icon, href, loading, unavailable, linkLabel, }: {
    label: string;
    value: ReactNode;
    prefix?: ReactNode;
    description?: ReactNode;
    icon?: IconType;
    href?: string;
    loading?: boolean;
    unavailable?: boolean;
    linkLabel?: string;
}): import("react/jsx-runtime").JSX.Element;
