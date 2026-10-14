import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { WorkspaceLayout } from '../../dist';

function Fixture() {
  const [identity, setIdentity] = useState('member');
  const [path, setPath] = useState('/inbox');
  const [revision, setRevision] = useState(0);
  window.switchAccount = setIdentity;
  window.navigate = setPath;
  window.finishMutation = () => setRevision((n) => n + 1);
  return (
    <WorkspaceLayout
      nav={{
        Workspace: [
          { name: 'Overview', href: '/', icon: 'Home' },
          {
            name: 'Inbox',
            href: '/inbox',
            icon: 'Bell',
            attentionKey: 'notifications',
          },
          {
            name: 'Chat',
            href: '/chat',
            icon: 'Chat',
            attentionKey: 'chat',
          },
          {
            name: 'Applications',
            href: '/applications',
            icon: 'UserCard',
            attentionKey: 'applications',
          },
          {
            name: 'Contact inbox',
            href: '/contact',
            icon: 'Mail',
            attentionKey: 'contact',
          },
        ],
      }}
      currentPath={path}
      onNavigate={setPath}
      workspaceName="Agency management"
      attention={{
        apiBaseUrl: window.location.origin,
        identity,
        refreshKey: revision,
      }}
    >
      <p>Workspace fixture</p>
    </WorkspaceLayout>
  );
}
createRoot(document.getElementById('root')).render(
  <Fixture />,
);
