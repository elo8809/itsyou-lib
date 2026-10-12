import { ReactNode } from 'react';
declare const InputWrapper: ({ label, htmlFor, errorId, children, className, error, hideError, info, toolTipWrapperClassName, toolTipHeaderClassName, toolTipContentClassName, }: {
    children: ReactNode;
    label?: string;
    htmlFor?: string;
    errorId?: string;
    className?: string;
    error?: string;
    hideError?: boolean;
    info?: {
        title: string;
        toolTip: ReactNode;
    };
    toolTipHeaderClassName?: string;
    toolTipWrapperClassName?: string;
    toolTipContentClassName?: string;
}) => import("react/jsx-runtime").JSX.Element;
export default InputWrapper;
