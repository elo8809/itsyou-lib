import { useId } from 'react';
export default function DocumentPreview({
  html,
  title = 'Document preview',
  className,
}: {
  html: string;
  title?: string;
  className?: string;
}) {
  const id = useId();
  // No scripts, forms, downloads, popups, or same-origin access inside a preview.
  return (
    <iframe
      id={id}
      title={title}
      sandbox=""
      referrerPolicy="no-referrer"
      className={className || 'ui-document-preview'}
      srcDoc={html.replace(
        /<head\b[^>]*>/i,
        (head) =>
          `${head}<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">`,
      )}
    />
  );
}
