import type { ChatLocale } from './types';
/** Embedded request conversations share the inbox, message history and composer. */
export default function RequestChat({ apiBaseUrl, clientRequestId, locale, }: {
    apiBaseUrl: string;
    clientRequestId: string;
    locale?: ChatLocale;
}): import("react/jsx-runtime").JSX.Element;
