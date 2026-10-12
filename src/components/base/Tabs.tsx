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
          : 'ui-segmented-tabs',
      )}
    >
      <div
        className={classNames(
          listWrapperClassName,
          underline
            ? 'ui-content-tabs-scroll'
            : 'ui-segmented-tabs-scroll',
        )}
      >
        <Tab.List
          aria-label={label}
          className={classNames(
            listClassName,
            underline
              ? 'ui-content-tabs-list'
              : 'ui-segmented-tabs-list',
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
                    : 'ui-segmented-tab',
                  selected && selectedClassName,
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
