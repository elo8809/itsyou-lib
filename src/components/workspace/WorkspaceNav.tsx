import Link from 'next/link';
import Icon from '../base/Icon';
import type { AttentionCounts } from './useAttentionCounts';
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
  counts = {},
  attentionLabel = 'needing attention',
}: {
  nav: Navigation;
  selectedPath: string;
  close?: () => void;
  label?: string;
  showGroupLabels?: boolean;
  counts?: AttentionCounts;
  attentionLabel?: string;
}) {
  return (
    <nav aria-label={label} className="ui-nav">
      {Object.entries(nav).map(([group, items]) => (
        <div key={group} className="ui-nav-group">
          {showGroupLabels && (
            <p className="ui-nav-label">{group}</p>
          )}
          <ul>
            {items.map((item) => {
              const value = item.attentionKey
                ? counts[item.attentionKey]
                : 0;
              const count = Number.isFinite(value)
                ? Math.max(0, Math.floor(value!))
                : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className="ui-nav-link"
                    aria-label={
                      count > 0
                        ? `${item.name}, ${count} ${attentionLabel}`
                        : undefined
                    }
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
                    <span
                      className="ui-nav-name"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    {count > 0 && (
                      <span
                        className="ui-nav-count"
                        aria-hidden="true"
                        title={`${count} ${attentionLabel}`}
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
