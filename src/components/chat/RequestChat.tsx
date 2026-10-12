import ChatWorkspace from './ChatWorkspace';
import type { ChatLocale } from './types';

/** Embedded request conversations share the inbox, message history and composer. */
export default function RequestChat({
  apiBaseUrl,
  clientRequestId,
  locale = 'en',
}: {
  apiBaseUrl: string;
  clientRequestId: string;
  locale?: ChatLocale;
}) {
  return (
    <ChatWorkspace
      key={clientRequestId}
      apiBaseUrl={apiBaseUrl}
      clientRequestId={clientRequestId}
      locale={locale}
      embedded
    />
  );
}
