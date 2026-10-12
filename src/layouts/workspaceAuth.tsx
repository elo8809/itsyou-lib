import { ReactNode } from 'react';
import Logo from '../components/base/Logo';
export interface WorkspaceAuthLayoutProps {
  children: ReactNode;
  workspaceLabel: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  brand?: ReactNode;
  formHeader?: ReactNode;
  storyFooter?: ReactNode;
  footer?: ReactNode;
}
export default function WorkspaceAuthLayout({
  children,
  workspaceLabel,
  eyebrow,
  title,
  description,
  brand,
  formHeader,
  storyFooter,
  footer,
}: WorkspaceAuthLayoutProps) {
  return (
    <div className="ui-login">
      <aside className="ui-login-story">
        <div className="ui-login-logo">
          {brand || <Logo mode="white" size={60} />}
          <span>{workspaceLabel}</span>
        </div>
        <div className="ui-login-message">
          {eyebrow && <p>{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <div>{description}</div>}
        </div>
        {storyFooter && (
          <div className="ui-login-story-footer">
            {storyFooter}
          </div>
        )}
      </aside>
      <main className="ui-login-main">
        <div className="ui-login-card">
          {formHeader}
          {children}
        </div>
        {footer && (
          <div className="ui-login-footer">{footer}</div>
        )}
      </main>
    </div>
  );
}
