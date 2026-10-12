import type {
  NavEntry,
  TDashboardNav,
} from '../base/DashboardNav';

export type WorkspaceNav = TDashboardNav;
export type WorkspaceRoute = NavEntry & { group: string };
export const isActiveRoute = (
  path: string,
  href: string,
) => {
  const clean =
    path.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  return href === '/'
    ? clean === '/'
    : clean === href || clean.startsWith(`${href}/`);
};
export function flattenNavigation(
  nav: WorkspaceNav,
): WorkspaceRoute[] {
  const collect = (
    items: NavEntry[],
    group: string,
  ): WorkspaceRoute[] =>
    items.flatMap((item) => [
      { ...item, group },
      ...collect(item.children || [], group),
    ]);
  return Object.entries(nav).flatMap(([group, items]) =>
    collect(items, group),
  );
}
export function findActiveRoute(
  nav: WorkspaceNav,
  path: string,
) {
  return flattenNavigation(nav)
    .filter((item) => isActiveRoute(path, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
export const workspaceLabels = {
  navigation: 'Main navigation',
  secondaryNavigation: 'More pages',
  openNavigation: 'Open navigation',
  closeNavigation: 'Close navigation',
  skipToContent: 'Skip to content',
  breadcrumb: 'Breadcrumb',
  workspace: 'Workspace',
  overview: 'Overview',
  details: 'Details',
  search: 'Search workspace',
  jumpTo: 'Jump to…',
  searchTitle: 'Navigate workspace',
  searchInput: 'Search pages',
  searchPlaceholder: 'Where would you like to go?',
  closeSearch: 'Close search',
  pages: 'Pages',
  noResults: 'No matching pages. Try a different name.',
  navigate: 'to navigate',
  open: 'to open',
  close: 'to close',
  account: 'Account menu',
  signOut: 'Sign out',
};
export type WorkspaceLabels = typeof workspaceLabels;
