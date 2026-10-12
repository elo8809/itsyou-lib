import {
  ReactNode,
  useEffect,
  useId,
  useState,
} from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';
import Icon from '../components/base/Icon';
import Logo from '../components/base/Logo';
import WorkspaceNav from '../components/workspace/WorkspaceNav';
import CommandMenu from '../components/workspace/CommandMenu';
import {
  findActiveRoute,
  WorkspaceNav as Navigation,
  workspaceLabels,
  WorkspaceLabels,
} from '../components/workspace/navigation';

export interface WorkspaceLayoutProps {
  children: ReactNode;
  nav: Navigation;
  currentPath: string;
  navigationKey?: string;
  busy?: boolean;
  onNavigate: (href: string) => void;
  account?: {
    name: string;
    email?: string | null;
    role?: string;
    onSignOut?: () => void;
  };
  workspaceName: string;
  workspaceDescription?: string;
  brand?: ReactNode;
  brandSubtitle?: string;
  homeHref?: string;
  contentClassName?: string;
  sidebarFooter?: ReactNode;
  /** Pin the account's sign-out action below the scrollable navigation. */
  sidebarSignOut?: boolean;
  footer?: ReactNode;
  headerActions?: ReactNode;
  labels?: Partial<WorkspaceLabels>;
}

export default function WorkspaceLayout({
  children,
  nav,
  currentPath,
  navigationKey = currentPath,
  busy = false,
  onNavigate,
  account,
  workspaceName,
  workspaceDescription,
  brand,
  brandSubtitle = 'IT’S YOU',
  homeHref = '/',
  contentClassName = '',
  sidebarFooter,
  sidebarSignOut = false,
  footer,
  headerActions,
  labels: customLabels,
}: WorkspaceLayoutProps) {
  const labels = { ...workspaceLabels, ...customLabels };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const mainId = useId();
  const selected = findActiveRoute(nav, currentPath);
  const showSidebarSignOut = sidebarSignOut && !!account?.onSignOut;
  const sidebarClassName = showSidebarSignOut
    ? ' ui-sidebar--with-actions'
    : '';
  const initials =
    account?.name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('') || 'iy.';
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'k'
      ) {
        e.preventDefault();
        setMobileOpen(false);
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () =>
      window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [navigationKey]);
  const sidebar = (
    <>
      <div className="ui-sidebar-brand">
        {brand || (
          <Link
            href={homeHref}
            aria-label={`IT’S YOU · ${labels.overview}`}
            className="ui-brand"
          >
            <Logo size={38} />
            <span>
              IT’S YOU<span>{brandSubtitle}</span>
            </span>
          </Link>
        )}
      </div>
      <div className="ui-sidebar-scroll">
        <div className="ui-workspace-label">
          <span className="ui-workspace-mark">iy.</span>
          <div>
            {workspaceName}
            {workspaceDescription && (
              <small>{workspaceDescription}</small>
            )}
          </div>
        </div>
        <WorkspaceNav
          nav={nav}
          selectedPath={currentPath}
          close={() => setMobileOpen(false)}
          label={labels.navigation}
        />
      </div>
      {showSidebarSignOut ? (
        <div className="ui-sidebar-actions">
          {sidebarFooter && (
            <div className="ui-sidebar-caption">{sidebarFooter}</div>
          )}
          <button
            type="button"
            className="ui-nav-link ui-sidebar-sign-out"
            onClick={() => {
              setMobileOpen(false);
              account?.onSignOut?.();
            }}
          >
            <Icon name="Switch" size={19} aria-hidden="true" />
            <span>{labels.signOut}</span>
          </button>
        </div>
      ) : sidebarFooter && (
        <div className="ui-sidebar-bottom">
          {sidebarFooter}
        </div>
      )}
    </>
  );
  return (
    <div className="ui-shell">
      <a href={`#${mainId}`} className="ui-skip-link">
        {labels.skipToContent}
      </a>
      <aside className={`ui-sidebar${sidebarClassName}`}>{sidebar}</aside>
      <Dialog
        open={mobileOpen}
        onClose={setMobileOpen}
        className="ui-mobile-dialog"
      >
        <DialogBackdrop className="ui-dialog-backdrop" />
        <DialogPanel className={`ui-mobile-sidebar${sidebarClassName}`}>
          <DialogTitle className="sr-only">
            {labels.navigation}
          </DialogTitle>
          <button
            type="button"
            className="ui-icon-button ui-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label={labels.closeNavigation}
          >
            <Icon name="Close" size={18} />
          </button>
          {sidebar}
        </DialogPanel>
      </Dialog>
      <div className="ui-workspace">
        <header className="ui-topbar">
          <div className="ui-update-progress" data-active={busy} aria-hidden="true" />
          <button
            type="button"
            className="ui-icon-button ui-menu-trigger"
            onClick={() => setMobileOpen(true)}
            aria-label={labels.openNavigation}
          >
            <Icon name="Menu" size={20} />
          </button>
          <nav
            aria-label={labels.breadcrumb}
            className="ui-breadcrumb"
          >
            <span>
              {selected?.group || labels.workspace}
            </span>
            <span aria-hidden="true">/</span>
            <Link href={selected?.href || homeHref}>
              {selected?.name || labels.overview}
            </Link>
            {selected && currentPath !== selected.href && (
              <>
                <span aria-hidden="true">/</span>
                <span className="ui-breadcrumb-detail">
                  {labels.details}
                </span>
              </>
            )}
          </nav>
          <div className="ui-topbar-actions">
            {headerActions}
            <button
              type="button"
              className="ui-search-trigger"
              onClick={() => setSearchOpen(true)}
              aria-label={labels.search}
              aria-keyshortcuts="Meta+K Control+K"
            >
              <Icon name="Search" size={17} />
              <span>{labels.jumpTo}</span>
              <kbd>⌘ K</kbd>
            </button>
            {account && (
              <>
                <span className="ui-topbar-divider" />
                <Menu>
                  <MenuButton
                    className="ui-account-button"
                    aria-label={labels.account}
                  >
                    <span className="ui-avatar">
                      {initials}
                    </span>
                    <Icon name="ChevronDown" size={14} />
                  </MenuButton>
                  <MenuItems
                    anchor="bottom end"
                    className="ui-account-menu"
                  >
                    <div className="ui-account-info">
                      <strong>{account.name}</strong>
                      {account.email && (
                        <span>{account.email}</span>
                      )}
                      {account.role && (
                        <small>{account.role}</small>
                      )}
                    </div>
                    {account.onSignOut && (
                      <MenuItem>
                        <button
                          type="button"
                          onClick={account.onSignOut}
                        >
                          {labels.signOut}
                          <Icon
                            name="ArrowRight"
                            size={16}
                          />
                        </button>
                      </MenuItem>
                    )}
                  </MenuItems>
                </Menu>
              </>
            )}
          </div>
        </header>
        <main
          id={mainId}
          tabIndex={-1}
          className={`ui-content ${contentClassName}`}
        >
          {children}
        </main>
        {footer && (
          <footer className="ui-footer">{footer}</footer>
        )}
      </div>
      <CommandMenu
        nav={nav}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={onNavigate}
        labels={labels}
      />
    </div>
  );
}
