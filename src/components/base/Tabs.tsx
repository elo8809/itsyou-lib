import React, { ReactNode } from 'react';
import { Tab } from '@headlessui/react';
import classNames from 'classnames/dedupe';

interface Props {
  items: {
    name: string;
    panel: ReactNode;
    count?: number;
  }[];
  variant?: 'segmented' | 'underline';
  label?: string;
  selectedIndex?: number;
  onChange?: (index: number) => void;
  /** Preserve forms and drafts while switching between panels. */
  keepMounted?: boolean;
  listClassName?: string;
  wrapperClassName?: string;
  listWrapperClassName?: string;
  buttonClassName?: string;
  selectedClassName?: string;
}

export default function Tabs({
  items,
  listClassName,
  buttonClassName,
  listWrapperClassName,
  selectedClassName,
  wrapperClassName,
  variant = 'segmented',
  label,
  selectedIndex,
  onChange,
  keepMounted = false,
}: Props) {
  const underline = variant === 'underline';
  return (
    <Tab.Group
      selectedIndex={selectedIndex}
      onChange={onChange}
      className={classNames(
        wrapperClassName,
        underline
          ? 'ui-content-tabs'
          : 'flex flex-col items-center space-y-6',
      )}
    >
      <div
        className={classNames(
          listWrapperClassName,
          underline
            ? 'ui-content-tabs-scroll'
            : 'w-full flex justify-center',
        )}
      >
        <Tab.List
          aria-label={label}
          className={classNames(
            listClassName,
            underline
              ? 'ui-content-tabs-list'
              : 'flex rounded-xl bg-gray-100 p-1 w-full max-w-md overflow-x-auto no-scrollbar',
          )}
        >
          {items.map((item) => (
            <Tab
              key={item.name}
              className={({ selected }) =>
                classNames(
                  buttonClassName,
                  underline
                    ? 'ui-content-tab'
                    : 'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  selected
                    ? [
                        !underline &&
                          'bg-white text-gray-900 shadow',
                        selectedClassName,
                      ]
                    : !underline && 'hover:bg-white/[0.12]',
                )
              }
            >
              {item.name}
              {item.count !== undefined && (
                <span className="ui-content-tab-count">
                  {item.count}
                </span>
              )}
            </Tab>
          ))}
        </Tab.List>
      </div>
      <Tab.Panels className="w-full">
        {items.map((item, idx) => (
          <Tab.Panel key={idx} unmount={!keepMounted}>
            {item.panel}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
