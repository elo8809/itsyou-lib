import React, { InputHTMLAttributes } from 'react';
import { IconType } from './Icon';
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: IconType;
    wrapperClassName?: string;
    label?: string;
    error?: string;
    hideError?: boolean;
}
declare const _default: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
export default _default;
