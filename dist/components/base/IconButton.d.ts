import { ButtonHTMLAttributes, MouseEventHandler } from 'react';
import { IconType } from './Icon';
interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    onClick?: MouseEventHandler<any>;
    icon: IconType;
    isLoading?: boolean;
    href?: string;
    target?: string;
    rel?: string;
    iconClassName?: string;
    size?: number;
    loaderColor?: 'light' | 'dark';
}
export default function IconButton({ onClick, icon, isLoading, href, target, rel, disabled, className, size, iconClassName, loaderColor, title, ...rest }: IconButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
