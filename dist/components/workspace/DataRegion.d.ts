import { ReactNode } from 'react';
/** Keep successful content mounted during refreshes and recoverable errors. */
export default function DataRegion({ children, loading, updating, error, hasData, onRetry, skeleton, locale, errorTitle, minHeight, className, }: {
    children: ReactNode;
    loading?: boolean;
    updating?: boolean;
    error?: boolean;
    hasData: boolean;
    onRetry?: () => void;
    skeleton?: ReactNode;
    locale?: 'en' | 'de';
    errorTitle?: string;
    minHeight?: number | string;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function ListSkeleton({ rows, rowHeight, }: {
    rows?: number;
    rowHeight?: number;
}): import("react/jsx-runtime").JSX.Element;
