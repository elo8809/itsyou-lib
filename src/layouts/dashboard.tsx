import { ReactNode, useState } from 'react';
import classNames from 'classnames/dedupe';
import DashboardNav, {
  TDashboardNav,
} from '../components/base/DashboardNav';
import Logo from '../components/base/Logo';
import Icon from '../components/base/Icon';
import MobileSideBar from '../components/base/MobileSideBar';
import FooterMini from '../components/base/FooterMini';
import { getNestedRoute } from '../utils/routes';

interface Props {
  children: React.ReactNode;
  nav: TDashboardNav;
  contentClassName?: string;
  currentPath: string;
  sidebarFooter?: ReactNode;
}

export default function DashboardLayout({
  children,
  nav,
  contentClassName,
  currentPath,
  sidebarFooter,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const routes = getNestedRoute(nav, currentPath);
  const [selectedRoute] = routes;
  return (
    <div className={'w-screen'}>
      <MobileSideBar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        footer={sidebarFooter}
      >
        <DashboardNav
          close={() => setSidebarOpen(false)}
          nav={nav}
          selectedPath={selectedRoute?.href || ''}
        />
      </MobileSideBar>
      <div
        className={
          'min-h-screen xl:max-h-screen flex flex-col'
        }
      >
        <div className="w-full xl:hidden sticky top-0 left-0 right-0 z-40 h-16 border-b bg-white flex items-center gap-x-6 shrink-0 px-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5"
          >
            <span className="sr-only">Open sidebar</span>
            <Icon
              name={'Menu'}
              aria-hidden="true"
              className="size-5"
            />
          </button>
        </div>
        {/* Static sidebar for desktop */}

        <div className="flex w-full xl:max-w-8xl xl:mx-auto flex-grow xl:border-r xl:border-l">
          <div className="hidden xl:flex xl:w-1/6 xl:flex-col">
            <div className="sticky top-0 flex h-screen flex-col gap-y-5 overflow-y-auto border-r bg-white px-6">
              <div className="flex h-16 shrink-0 items-center">
                <Logo />
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <DashboardNav
                  selectedPath={selectedRoute?.href || ''}
                  nav={nav}
                />
                {sidebarFooter && (
                  <div className="mt-auto border-t border-gray-200 pt-4 pb-6">
                    {sidebarFooter}
                  </div>
                )}
              </div>
            </div>
          </div>
          <main className="bg-white w-full xl:w-5/6 flex flex-col">
            <div
              className={
                'sticky top-0 py-3 flex items-center space-x-2 bg-white border-b px-3 md:px-6 z-30'
              }
            >
              {/*<Icon className={"text-gray-500"} name={selectedRoute().icon}/>*/}
              <h1 className={'flex space-x-1.5'}>
                {routes.map((route, i) => (
                  <div
                    key={route.name}
                    className={'flex space-x-1.5'}
                  >
                    <span>{route.name}</span>
                    {routes.length - 1 !== i && (
                      <span>»</span>
                    )}
                  </div>
                ))}
              </h1>
            </div>
            <div
              className={classNames(
                contentClassName,
                'w-full p-3 xl:p-6 flex-grow flex flex-col overflow-y-scroll no-scrollbar',
              )}
            >
              {children}
            </div>
          </main>
        </div>
        <FooterMini />
      </div>
    </div>
  );
}
