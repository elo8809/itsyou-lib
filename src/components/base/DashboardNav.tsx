import Link from 'next/link';
import classNames from 'classnames/dedupe';
import Icon, { IconType } from './Icon';
import type { AttentionKey } from '../workspace/useAttentionCounts';

export type NavEntry = {
  name: string;
  href: string;
  icon: IconType;
  attentionKey?: AttentionKey;
  children?: NavEntry[];
};

export type TDashboardNav = Record<string, NavEntry[]>;

const DashboardNav = ({
  nav,
  selectedPath,
  close,
}: {
  nav: TDashboardNav;
  selectedPath: string;
  close?: () => void;
}) => {
  const groups = Object.keys(nav);
  const ul = (group: string) => (
    <ul key={group} className={'space-y-1.5'}>
      {nav[group].map((item) => (
        <li
          onClick={() => close?.()}
          key={item.name}
          className={classNames(
            'hover:bg-gray-50 rounded-lg',
            {
              'bg-gray-100': selectedPath === item.href,
            },
          )}
        >
          <Link
            href={item.href}
            className={'flex space-x-3 items-center p-2'}
          >
            <Icon
              name={item.icon}
              className={classNames(
                'text-gray-500',
                selectedPath === item.href
                  ? '!text-primary'
                  : '',
              )}
            />
            <span
              className={classNames(
                'text-gray-800 font-semibold',
                selectedPath === item.href
                  ? '!text-primary'
                  : '',
              )}
            >
              {item.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={'py-6'}>
      <div className={'space-y-24'}>
        {groups.map((group) => ul(group))}
      </div>
    </div>
  );
};

export default DashboardNav;
