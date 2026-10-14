import { useEffect, useId, useState } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import Icon from '../base/Icon';
import {
  flattenNavigation,
  workspaceLabels,
  WorkspaceLabels,
  WorkspaceNav,
} from './navigation';

export default function CommandMenu({
  nav,
  open,
  onClose,
  onNavigate,
  labels: customLabels,
}: {
  nav: WorkspaceNav;
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
  labels?: Partial<WorkspaceLabels>;
}) {
  const labels = { ...workspaceLabels, ...customLabels };
  const id = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);
  const items = flattenNavigation(nav).filter((item) =>
    `${item.name} ${item.group}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const navigate = (href: string) => {
    onClose();
    onNavigate(href);
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="ui-command-dialog"
    >
      <DialogBackdrop className="ui-dialog-backdrop" />
      <div className="ui-command-position">
        <DialogPanel className="ui-command-panel">
          <DialogTitle className="sr-only">
            {labels.searchTitle}
          </DialogTitle>
          <div className="ui-command-search">
            <Icon
              name="Search"
              size={20}
              aria-hidden="true"
            />
            <input
              autoFocus
              aria-label={labels.searchInput}
              placeholder={labels.searchPlaceholder}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={`${id}-results`}
              aria-activedescendant={
                items.length ? `${id}-${active}` : undefined
              }
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (
                  e.key === 'ArrowDown' ||
                  e.key === 'ArrowUp'
                ) {
                  e.preventDefault();
                  const next =
                    (active +
                      (e.key === 'ArrowDown' ? 1 : -1) +
                      items.length) %
                    (items.length || 1);
                  setActive(next);
                  document
                    .getElementById(`${id}-${next}`)
                    ?.scrollIntoView({ block: 'nearest' });
                }
                if (e.key === 'Enter' && items[active]) {
                  e.preventDefault();
                  navigate(items[active].href);
                }
              }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={labels.closeSearch}
              className="ui-icon-button"
            >
              <Icon name="Close" size={18} />
            </button>
          </div>
          <p className="ui-command-label">{labels.pages}</p>
          <ul
            id={`${id}-results`}
            role="listbox"
            aria-label={labels.pages}
            className="ui-command-results"
          >
            {items.map((item, index) => (
              <li
                id={`${id}-${index}`}
                key={item.href}
                role="option"
                aria-selected={active === index}
                onMouseMove={() => setActive(index)}
                onClick={() => navigate(item.href)}
              >
                <Icon
                  name={item.icon}
                  size={19}
                  aria-hidden="true"
                />
                <span
                  className="min-w-0 truncate"
                  title={item.name}
                >
                  {item.name}
                </span>
                <small>{item.group}</small>
                <Icon
                  name="ArrowRight"
                  size={16}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
          {!items.length && (
            <p className="ui-command-empty">
              {labels.noResults}
            </p>
          )}
          <div className="ui-command-footer">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> {labels.navigate}
            </span>
            <span>
              <kbd>↵</kbd> {labels.open}
            </span>
            <span>
              <kbd>esc</kbd> {labels.close}
            </span>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
