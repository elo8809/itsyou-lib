import React from 'react';
import { IconType } from './Icon';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    filled?: boolean;
    styleType?: 'dark' | 'light';
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    target?: string;
    rel?: string;
    icon?: IconType;
    trailingIcon?: IconType;
    wrapperClassName?: string;
    iconClassName?: string;
    isLoading?: boolean;
}
export default function Button({ styleType, variant, size, children, className, wrapperClassName, icon, trailingIcon, href, isLoading, iconClassName, disabled, filled: _filled, ...rest }: ButtonProps): import("react/jsx-runtime").JSX.Element;
