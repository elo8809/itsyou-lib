import {
  ReactNode,
  useEffect,
  useId,
  useState,
} from 'react';
import Icon from '../base/Icon';
import type {
  ChatGrouping,
  ChatLocale,
  ChatSummary,
} from './types';
import type { ChatLabels } from './labels';
import { groupConversations } from './grouping';

function Group({
  label,
  kind,
  children,
  chats,
  selected,
  search,
}: {
  label: string;
  kind: 'client' | 'general';
  children: ReactNode;
  chats: ChatSummary[];
  selected?: string;
  search: string;
}) {
  const id = useId();
  const [expanded, setExpanded] = useState(true);
  const hasSelected = chats.some(
    (chat) => chat.id === selected,
  );
  useEffect(() => {
    if (hasSelected || search) setExpanded(true);
  }, [hasSelected, selected, search]);
  const unread = chats.reduce(
    (sum, chat) => sum + chat.unreadCount,
    0,
  );
  return (
    <section
      className="ui-chat-conversation-group"
      data-kind={kind}
    >
      <button
        type="button"
        className="ui-chat-group-heading"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded((value) => !value)}
      >
        <Icon
          name="ChevronDown"
          size={13}
          className={
            expanded ? '' : 'ui-chat-group-collapsed'
          }
        />
        <Icon
          name={kind === 'client' ? 'Company' : 'Chat'}
          size={15}
        />
        <span title={label}>{label}</span>
        {unread > 0 && (
          <span className="ui-chat-count">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      <div
        id={id}
        className="ui-chat-group-content"
        hidden={!expanded}
      >
        {children}
      </div>
    </section>
  );
}

export default function ChatConversationList({
  chats,
  grouping,
  selected,
  onSelect,
  locale,
  labels: t,
  search,
}: {
  chats: ChatSummary[];
  grouping: ChatGrouping;
  selected?: string;
  onSelect: (id: string) => void;
  locale: ChatLocale;
  labels: ChatLabels;
  search: string;
}) {
  function time(date: string) {
    const value = new Date(date);
    return value.toDateString() ===
      new Date().toDateString()
      ? value.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        })
      : value.toLocaleDateString(locale, {
          day: 'numeric',
          month: 'short',
        });
  }
  function conversation(chat: ChatSummary) {
    return (
      <button
        type="button"
        key={chat.id}
        className="ui-chat-list-item"
        data-active={selected === chat.id}
        aria-current={
          selected === chat.id ? 'true' : undefined
        }
        onClick={() => onSelect(chat.id)}
      >
        <span className="ui-chat-avatar ui-chat-group-avatar">
          <Icon name="Users" size={18} />
        </span>
        <span className="ui-chat-list-content">
          <span className="ui-chat-list-title">
            <strong>{chat.title}</strong>
            <time dateTime={chat.updatedAt}>
              {time(chat.updatedAt)}
            </time>
          </span>
          <span className="ui-chat-list-preview">
            <span>
              {chat.lastMessage
                ? `${chat.lastMessage.senderName}: ${chat.lastMessage.body}`
                : chat.description ||
                  `${chat.participantCount} ${t.participants}`}
            </span>
            {chat.unreadCount > 0 && (
              <span
                className="ui-chat-count"
                aria-label={`${chat.unreadCount} ${t.unread}`}
              >
                {chat.unreadCount > 99
                  ? '99+'
                  : chat.unreadCount}
              </span>
            )}
          </span>
          <span className="ui-chat-list-meta">
            {chat.participantCount} {t.participants}
          </span>
        </span>
      </button>
    );
  }
  return (
    <>
      {grouping === 'none'
        ? chats.map(conversation)
        : groupConversations(chats).map((group) => (
            <Group
              key={group.id}
              label={group.client?.name || t.general}
              kind={group.client ? 'client' : 'general'}
              chats={group.chats}
              selected={selected}
              search={search}
            >
              {group.chats.map(conversation)}
            </Group>
          ))}
    </>
  );
}
