import DataRegion, {
  ListSkeleton,
} from '../workspace/DataRegion';
import { useState } from 'react';
import Link from 'next/link';
import Button from '../base/Button';
import Icon, { IconType } from '../base/Icon';
import NotificationMenu from '../workspace/NotificationMenu';
import PageHeader from '../workspace/PageHeader';
import Panel from '../workspace/Panel';
import FilterTabs from '../workspace/FilterTabs';
import {
  Badge,
  EmptyState,
  InlineNotice,
  Skeleton,
} from '../workspace/Feedback';
import useNotificationFeed, {
  NotificationItem,
} from './useNotificationFeed';

export type NotificationProps = {
  apiBaseUrl: string;
  audience: 'admin' | 'client' | 'model';
  identity: string;
  locale?: 'en' | 'de';
  inboxHref?: string;
  pitchUrl?: (id: string) => string;
  /** Overrides the hint under the empty state, e.g. what will show up here. */
  emptyHint?: string;
};
const copy = {
  en: {
    title: 'Notifications',
    inbox: 'Inbox',
    eyebrow: 'YOUR WORKSPACE',
    subtitle:
      'Client requests, model responses and documents, together in one inbox.',
    empty: 'You’re all caught up',
    emptyHint: 'New activity will appear here.',
    unread: 'Unread',
    all: 'All',
    open: 'Open',
    done: 'Done',
    read: 'Mark as read',
    readAll: 'Mark all as read',
    view: 'Open details',
    portfolio: 'View portfolio',
    complete: 'Mark done',
    more: 'Load earlier notifications',
    allItems: 'Open inbox',
    error: 'Notifications could not be loaded.',
    actionError:
      'The change could not be saved. Please try again.',
    retry: 'Try again',
    loading: 'Loading notifications',
  },
  de: {
    title: 'Benachrichtigungen',
    inbox: 'Posteingang',
    eyebrow: 'DEIN POSTEINGANG',
    subtitle:
      'Anfragen, Verträge und Unterlagen – alle Neuigkeiten an einem Ort.',
    empty: 'Alles auf dem neuesten Stand',
    emptyHint: 'Neue Mitteilungen erscheinen hier.',
    unread: 'Ungelesen',
    all: 'Alle',
    open: 'Offen',
    done: 'Erledigt',
    read: 'Als gelesen markieren',
    readAll: 'Alle als gelesen markieren',
    view: 'Details öffnen',
    portfolio: 'Portfolio ansehen',
    complete: 'Erledigen',
    more: 'Ältere Benachrichtigungen laden',
    allItems: 'Alle Benachrichtigungen',
    error:
      'Benachrichtigungen konnten nicht geladen werden.',
    actionError:
      'Die Änderung konnte nicht gespeichert werden. Bitte erneut versuchen.',
    retry: 'Erneut versuchen',
    loading: 'Benachrichtigungen werden geladen',
  },
};
type Labels = typeof copy.en;
function eventIcon(kind: string): IconType {
  if (kind.startsWith('ORDER_REVIEW_')) return 'Star';
  if (kind.includes('CONTRACT') || kind === 'MODEL_SIGNED')
    return 'FileCheck';
  if (
    kind === 'RESOURCE_AVAILABLE' ||
    kind === 'INVOICE_READY' ||
    kind === 'COST_ESTIMATE_READY'
  )
    return 'File';
  if (kind === 'CONTACT_MESSAGE') return 'Inbox';
  if (kind === 'APPLICATION') return 'UserCard';
  if (
    kind.startsWith('PROFILE_') ||
    kind.startsWith('MODEL_')
  )
    return 'User';
  if (kind === 'PITCH_CREATED') return 'UserCard';
  return 'Inbox';
}

function NotificationRow({
  item,
  labels,
  locale,
  admin,
  busy,
  onRead,
  onDone,
  onNavigate,
  pitchUrl,
}: {
  item: NotificationItem;
  labels: Labels;
  locale: string;
  admin: boolean;
  busy: boolean;
  onRead: () => void;
  onDone: () => void;
  onNavigate?: () => void;
  pitchUrl?: NotificationProps['pitchUrl'];
}) {
  return (
    <li
      className="ui-notification-row"
      data-unread={!item.read}
    >
      <span className="ui-notification-event-icon">
        <Icon name={eventIcon(item.kind)} size={19} />
      </span>
      <div className="ui-notification-copy">
        <Link
          href={item.href}
          onClick={() => {
            if (!item.read) onRead();
            onNavigate?.();
          }}
          className="ui-notification-title"
          title={item.title}
        >
          {item.title}
        </Link>
        {item.description && (
          <p className="ui-notification-description">
            {item.description}
          </p>
        )}
        <div className="ui-notification-meta">
          <time dateTime={item.createdAt}>
            {new Intl.DateTimeFormat(
              locale === 'de' ? 'de-AT' : 'en-GB',
              {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              },
            ).format(new Date(item.createdAt))}
          </time>
          {admin && item.resolved && (
            <Badge>{labels.done}</Badge>
          )}
        </div>
        <div className="ui-notification-row-actions">
          {item.pitchId && pitchUrl && (
            <a
              href={pitchUrl(item.pitchId)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (!item.read) onRead();
              }}
            >
              {labels.portfolio}
              <span className="sr-only"> ↗</span>
            </a>
          )}
          {!item.read && (
            <button
              type="button"
              disabled={busy}
              onClick={onRead}
            >
              {labels.read}
            </button>
          )}
          {admin && !item.resolved && (
            <button
              type="button"
              disabled={busy}
              onClick={onDone}
            >
              {labels.complete}
            </button>
          )}
        </div>
      </div>
      {!item.read && (
        <span
          className="ui-notification-unread-dot"
          aria-label={labels.unread}
        />
      )}
    </li>
  );
}

function Content({
  state,
  props,
  labels,
  compact = false,
  onNavigate,
}: {
  state: ReturnType<typeof useNotificationFeed>;
  props: NotificationProps;
  labels: Labels;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { feed } = state;
  return (
    <>
      {state.actionError && (
        <div className="ui-notification-notice">
          <InlineNotice tone="error">
            {labels.actionError}
          </InlineNotice>
        </div>
      )}
      <DataRegion
        loading={!feed && !state.error}
        updating={state.loading}
        error={state.error}
        hasData={!!feed}
        onRetry={state.refresh}
        locale={props.locale || 'en'}
        errorTitle={labels.error}
        minHeight={compact ? 240 : 400}
        skeleton={<ListSkeleton rows={compact ? 3 : 5} />}
      >
        {feed && !feed.items.length ? (
          <EmptyState
            icon="Bell"
            title={labels.empty}
            description={
              props.emptyHint || labels.emptyHint
            }
          />
        ) : (
          feed && (
            <ul className="ui-notification-list">
              {(compact
                ? feed.items.slice(0, 5)
                : feed.items
              ).map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  labels={labels}
                  locale={props.locale || 'en'}
                  admin={props.audience === 'admin'}
                  busy={!!state.busy}
                  onRead={() =>
                    void state.act('read', { id: item.id })
                  }
                  onDone={() =>
                    void state.act('resolve', {
                      id: item.id,
                    })
                  }
                  onNavigate={onNavigate}
                  pitchUrl={props.pitchUrl}
                />
              ))}
            </ul>
          )
        )}
      </DataRegion>
    </>
  );
}

export function NotificationBell(props: NotificationProps) {
  const labels = copy[props.locale || 'en'];
  const state = useNotificationFeed(
    `${props.apiBaseUrl.replace(/\/$/, '')}/notifications/${props.audience}`,
    props.identity,
    props.audience === 'admin' ? 'open' : 'all',
  );
  return (
    <NotificationMenu
      label={labels.title}
      unreadCount={state.feed?.unreadCount || 0}
    >
      {(close) => (
        <>
          <div className="ui-notification-heading">
            <div>
              <h2>
                {props.audience === 'admin'
                  ? labels.inbox
                  : labels.title}
              </h2>
              <p>
                {state.feed?.unreadCount || 0}{' '}
                {labels.unread.toLocaleLowerCase()}
              </p>
            </div>
            {!!state.feed?.unreadCount && (
              <button
                type="button"
                disabled={
                  !!state.busy || !state.feed?.unreadCount
                }
                onClick={() =>
                  void state.act('read', {
                    before: state.feed!.asOf,
                  })
                }
              >
                {labels.readAll}
              </button>
            )}
          </div>
          <Content
            state={state}
            props={props}
            labels={labels}
            compact
            onNavigate={close}
          />
          <Link
            className="ui-notification-footer"
            href={props.inboxHref || '/notifications'}
            onClick={() => close()}
          >
            {labels.allItems}
            <Icon name="ArrowRight" size={16} />
          </Link>
        </>
      )}
    </NotificationMenu>
  );
}

export function NotificationInbox(
  props: NotificationProps,
) {
  const labels = copy[props.locale || 'en'];
  const admin = props.audience === 'admin';
  const [filter, setFilter] = useState(
    admin ? 'open' : 'all',
  );
  const state = useNotificationFeed(
    `${props.apiBaseUrl.replace(/\/$/, '')}/notifications/${props.audience}`,
    props.identity,
    filter,
  );
  const options = admin
    ? [
        {
          value: 'open',
          label: labels.open,
          count: state.feed?.openCount,
        },
        {
          value: 'unread',
          label: labels.unread,
          count: state.feed?.unreadCount,
        },
        { value: 'all', label: labels.all },
        { value: 'done', label: labels.done },
      ]
    : [
        { value: 'all', label: labels.all },
        {
          value: 'unread',
          label: labels.unread,
          count: state.feed?.unreadCount,
        },
      ];
  return (
    <div className="ui-notification-inbox">
      <PageHeader
        eyebrow={
          props.audience === 'client' &&
          props.locale === 'de'
            ? 'IHR POSTEINGANG'
            : labels.eyebrow
        }
        title={admin ? labels.inbox : labels.title}
        subtitle={labels.subtitle}
        actions={
          <Button
            variant="secondary"
            isLoading={state.busy === 'all'}
            disabled={
              !!state.busy || !state.feed?.unreadCount
            }
            onClick={() =>
              void state.act('read', {
                before: state.feed!.asOf,
              })
            }
          >
            {labels.readAll}
          </Button>
        }
      />
      <FilterTabs
        label={labels.title}
        value={filter}
        onChange={setFilter}
        options={options}
        variant="underline"
      />
      <Panel unpadded>
        <Content
          state={state}
          props={props}
          labels={labels}
        />
        {state.feed?.nextCursor && (
          <div className="ui-notification-load">
            <Button
              variant="secondary"
              size="sm"
              isLoading={state.loading}
              onClick={state.more}
            >
              {labels.more}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
