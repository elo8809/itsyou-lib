export default function AccountSettings({ apiBaseUrl, locale, onAccountChanged, }: {
    apiBaseUrl: string;
    locale?: 'en' | 'de';
    onAccountChanged?: () => Promise<unknown>;
}): import("react/jsx-runtime").JSX.Element;
