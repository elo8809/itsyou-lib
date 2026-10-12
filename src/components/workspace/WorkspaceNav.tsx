import Link from 'next/link';
import Icon from '../base/Icon';
import {
  isActiveRoute,
  WorkspaceNav as Navigation,
} from './navigation';

export default function WorkspaceNav({
  nav,
  selectedPath,
  close,
  label = 'Main navigation',
  showGroupLabels = true,
}: {
  nav: Navigation;
  selectedPath: string;
  close?: () => void;
  label?: string;
  showGroupLabels?: boolean;
}) {
  return (
    <nav aria-label={label} className="ui-nav">
      {Object.entries(nav).map(([group, items]) => (
        <div key={group} className="ui-nav-group">
          {showGroupLabels && (
            <p className="ui-nav-label">{group}</p>
          )}
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="ui-nav-link"
                  aria-current={
                    isActiveRoute(selectedPath, item.href)
                      ? 'page'
                      : undefined
                  }
                >
                  <Icon
                    name={item.icon}
                    size={19}
                    aria-hidden="true"
                  />
                  <span>{item.name}</span>
                  {isActiveRoute(
                    selectedPath,
                    item.href,
                  ) && <span className="ui-nav-dot" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
