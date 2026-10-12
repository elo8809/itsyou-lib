import { ReactNode } from 'react';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';
import Icon from '../base/Icon';

export interface NotificationMenuProps {
  label?: string;
  unreadCount: number;
  children: (close: () => void) => ReactNode;
}

/** Accessible notification surface; each app supplies its feed and actions. */
export default function NotificationMenu({
  label = 'Notifications',
  unreadCount,
  children,
}: NotificationMenuProps) {
  return (
    <Popover>
      {({ close }) => (
        <>
          <PopoverButton
            className="ui-icon-button ui-notification-trigger"
            aria-label={`${label}${unreadCount ? ` (${unreadCount})` : ''}`}
          >
            <Icon name="Bell" size={20} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="ui-notification-count"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </PopoverButton>
          <PopoverPanel
            anchor="bottom end"
            className="ui-notification-menu"
            aria-label={label}
          >
            {children(close)}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
