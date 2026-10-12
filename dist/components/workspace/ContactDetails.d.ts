export interface ContactLabels {
    title: string;
    email: string;
    phone: string;
    copy: string;
    copied: string;
    copyError: string;
    close: string;
    unavailable: string;
}
export declare function CopyButton({ value, label, copiedLabel, errorLabel, }: {
    value: string;
    label?: string;
    copiedLabel?: string;
    errorLabel?: string;
}): import("react/jsx-runtime").JSX.Element;
export interface ContactDetailsProps {
    name?: string;
    showMissing?: boolean;
    email?: string | null;
    phone?: string | null;
    labels?: Partial<ContactLabels>;
}
export declare function ContactDetails({ email, phone, labels: customLabels, showMissing, }: ContactDetailsProps): import("react/jsx-runtime").JSX.Element;
export declare function ContactPopover({ name, email, phone, labels: customLabels, }: ContactDetailsProps): import("react/jsx-runtime").JSX.Element;
