import React from 'react';
import { ButtonProps } from './Button';
interface Props extends ButtonProps {
    children?: string;
    errors?: unknown;
    Element?: React.ElementType;
    action?: string;
}
/** Compatibility adapter: existing actions use the shared confirmation flow. */
declare const ButtonSubmit: ({ children, onClick, action, Element, type: _type, errors: _errors, ...rest }: Props) => import("react/jsx-runtime").JSX.Element;
export default ButtonSubmit;
