import { ReactNode } from 'react';
export default function PageHeader({ title, subtitle, actions, onBack, backLabel, eyebrow, }: {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    onBack?: () => void;
    backLabel?: string;
    eyebrow?: string;
}): import("react/jsx-runtime").JSX.Element;
