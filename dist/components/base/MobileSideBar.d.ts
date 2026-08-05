import { ReactNode } from 'react';
export default function MobileSideBar({ children, open, setOpen, footer, }: {
    children: ReactNode;
    open: boolean;
    setOpen: (v: boolean) => void;
    footer?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
