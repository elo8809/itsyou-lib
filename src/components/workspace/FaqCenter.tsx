import { ReactNode, useId, useMemo, useRef, useState } from 'react';
import Button from '../base/Button';
import Icon, { IconType } from '../base/Icon';
import { EmptyState } from './Feedback';
import { Select } from './FormField';
import Input from '../base/Input';
import PageHeader from './PageHeader';
import Panel from './Panel';

export type FaqQuestion = {
  q: string;
  a: ReactNode;
  /** Extra search terms that do not appear in the text. */
  keywords?: string;
};
export type FaqTopic = {
  id: string;
  title: string;
  intro: string;
  icon?: IconType;
  items: FaqQuestion[];
};
export type FaqLabels = {
  searchLabel: string;
  searchPlaceholder: string;
  clearSearch: string;
  topics: string;
  allTopics: string;
  chooseTopic: string;
  answers: (count: number) => string;
  resultsFor: (query: string) => string;
  questions: (count: number) => string;
  emptyTitle: string;
  emptyDescription: string;
  resetSearch: string;
};
export type FaqSupport = {
  title: string;
  description: ReactNode;
  /** Buttons or links, e.g. to support or the chat. */
  actions: ReactNode;
  icon?: IconType;
};

const defaultLabels: FaqLabels = {
  searchLabel: 'Fragen und Antworten durchsuchen',
  searchPlaceholder: 'Alle Themen durchsuchen',
  clearSearch: 'Suche löschen',
  topics: 'Themen',
  allTopics: 'Alle Themen',
  chooseTopic: 'Thema auswählen',
  answers: (n) => `${n} ${n === 1 ? 'Antwort' : 'Antworten'}`,
  resultsFor: (q) => `für „${q}“ in allen Themen`,
  questions: (n) => `${n} ${n === 1 ? 'Frage' : 'Fragen'}`,
  emptyTitle: 'Keine passende Antwort gefunden',
  emptyDescription: 'Ein kürzeres Stichwort oder ein anderes Thema hilft.',
  resetSearch: 'Suche zurücksetzen',
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss');

/** Text content of an answer, so links and lists are searchable too. */
const plainText = (node: ReactNode): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number')
    return String(node);
  if (Array.isArray(node)) return node.map(plainText).join(' ');
  if (typeof node === 'object' && 'props' in node)
    return plainText(
      (node as { props: { children?: ReactNode } }).props.children,
    );
  return '';
};

/** Help center: topic navigation, full-text search and one-open accordion. */
export default function FaqCenter({
  topics: allTopics,
  eyebrow,
  title,
  subtitle,
  support,
  labels: labelOverrides,
  initialTopic,
}: {
  topics: FaqTopic[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  support?: FaqSupport;
  labels?: Partial<FaqLabels>;
  initialTopic?: string;
}) {
  const labels = { ...defaultLabels, ...labelOverrides };
  const uid = useId();
  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState(
    initialTopic || allTopics[0]?.id || 'all',
  );
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searching = !!query.trim();
  const totalQuestions = allTopics.reduce(
    (total, topic) => total + topic.items.length,
    0,
  );
  const topics = useMemo(() => {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    return allTopics
      .filter(
        (topic) =>
          terms.length || activeTopic === 'all' || topic.id === activeTopic,
      )
      .map((topic) => ({
        ...topic,
        items: topic.items
          .map((item, index) => ({ ...item, id: `${topic.id}-${index}` }))
          .filter((item) => {
            const text = normalize(
              `${topic.title} ${item.q} ${plainText(item.a)} ${item.keywords || ''}`,
            );
            return terms.every((term) => text.includes(term));
          }),
      }))
      .filter((topic) => topic.items.length);
  }, [allTopics, query, activeTopic]);
  const resultCount = topics.reduce(
    (total, topic) => total + topic.items.length,
    0,
  );
  const selectedTopic = searching ? 'all' : activeTopic;
  const changeTopic = (id: string) => {
    setActiveTopic(id);
    setQuery('');
    setOpenQuestion(null);
  };
  const clearSearch = () => {
    setQuery('');
    setOpenQuestion(null);
    searchInput.current?.focus();
  };

  return (
    <div className="ui-faq">
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="ui-faq-search">
        <Input
          ref={searchInput}
          type="search"
          icon="Search"
          aria-label={labels.searchLabel}
          placeholder={labels.searchPlaceholder}
          value={query}
          maxLength={100}
          hideError
          onChange={(event) => {
            setQuery(event.target.value);
            setOpenQuestion(null);
          }}
          wrapperClassName="ui-faq-search-input"
        />
        {searching && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            wrapperClassName="ui-faq-search-clear"
          >
            {labels.clearSearch}
          </Button>
        )}
      </div>

      <div className="ui-faq-layout">
        <aside className="ui-faq-sidebar">
          <nav aria-label={labels.topics} className="ui-faq-topics">
            <h2>{labels.topics}</h2>
            <button
              type="button"
              className="ui-faq-topic"
              aria-pressed={selectedTopic === 'all'}
              onClick={() => changeTopic('all')}
            >
              <Icon name="Search" size={17} aria-hidden="true" />
              <span>{labels.allTopics}</span>
              <small>{totalQuestions}</small>
            </button>
            {allTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className="ui-faq-topic"
                aria-pressed={selectedTopic === topic.id}
                onClick={() => changeTopic(topic.id)}
              >
                <Icon
                  name={topic.icon || 'Help'}
                  size={17}
                  aria-hidden="true"
                />
                <span>{topic.title}</span>
                <small>{topic.items.length}</small>
              </button>
            ))}
          </nav>
        </aside>
        <div className="ui-faq-content">
          <div className="ui-faq-mobile-topic">
            <label htmlFor={`${uid}-topic`}>{labels.chooseTopic}</label>
            <Select
              id={`${uid}-topic`}
              value={selectedTopic}
              onChange={(event) => changeTopic(event.target.value)}
              items={[
                { id: 'all', label: labels.allTopics },
                ...allTopics.map((topic) => ({
                  id: topic.id,
                  label: topic.title,
                })),
              ]}
            />
          </div>
          {searching && (
            <div className="ui-faq-results" role="status" aria-live="polite">
              <strong>{labels.answers(resultCount)}</strong>
              <span>{labels.resultsFor(query.trim())}</span>
            </div>
          )}
          {!topics.length ? (
            <Panel unpadded>
              <EmptyState
                icon="Search"
                title={labels.emptyTitle}
                description={labels.emptyDescription}
                action={
                  <Button type="button" variant="secondary" onClick={clearSearch}>
                    {labels.resetSearch}
                  </Button>
                }
              />
            </Panel>
          ) : (
            topics.map((topic) => (
              <section
                key={topic.id}
                aria-labelledby={`${uid}-${topic.id}-title`}
                className="ui-faq-section"
              >
                <div className="ui-faq-section-header">
                  <div>
                    <h2 id={`${uid}-${topic.id}-title`}>{topic.title}</h2>
                    <p>{topic.intro}</p>
                  </div>
                  <span>{labels.questions(topic.items.length)}</span>
                </div>
                <Panel unpadded>
                  {topic.items.map((item) => {
                    const open = openQuestion === item.id;
                    return (
                      <div
                        key={item.id}
                        className="ui-faq-question"
                        data-open={open}
                      >
                        <h3>
                          <button
                            type="button"
                            id={`${uid}-trigger-${item.id}`}
                            aria-expanded={open}
                            aria-controls={`${uid}-answer-${item.id}`}
                            onClick={() =>
                              setOpenQuestion(open ? null : item.id)
                            }
                            className="ui-faq-question-button"
                          >
                            <span>{item.q}</span>
                            <Icon
                              name={open ? 'Minus' : 'Plus'}
                              size={18}
                              aria-hidden="true"
                            />
                          </button>
                        </h3>
                        <div
                          id={`${uid}-answer-${item.id}`}
                          role="region"
                          aria-labelledby={`${uid}-trigger-${item.id}`}
                          hidden={!open}
                          className="ui-faq-answer"
                        >
                          {item.a}
                        </div>
                      </div>
                    );
                  })}
                </Panel>
              </section>
            ))
          )}
        </div>
      </div>

      {support && (
        <div className="ui-faq-support">
          <span className="ui-faq-support-icon">
            <Icon
              name={support.icon || 'MessageSmile'}
              size={21}
              aria-hidden="true"
            />
          </span>
          <div className="ui-faq-support-copy">
            <h2>{support.title}</h2>
            <p>{support.description}</p>
          </div>
          <div className="ui-faq-support-actions">{support.actions}</div>
        </div>
      )}
    </div>
  );
}
