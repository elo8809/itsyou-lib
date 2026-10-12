import { ReactNode } from 'react';
export default function FormActions({
  children,
  status,
  sticky = true,
}: {
  children: ReactNode;
  status?: ReactNode;
  sticky?: boolean;
}) {
  return (
    <div
      className={`ui-form-actions ${sticky ? 'ui-form-actions-sticky' : ''}`}
    >
      <div className="ui-form-actions-status" role="status">
        {status}
      </div>
      <div className="ui-form-actions-buttons">
        {children}
      </div>
    </div>
  );
}
