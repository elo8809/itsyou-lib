import { ReactNode } from 'react';
import { IconType } from '../base/Icon';
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
/** Help center: topic navigation, full-text search and one-open accordion. */
export default function FaqCenter({ topics: allTopics, eyebrow, title, subtitle, support, labels: labelOverrides, initialTopic, }: {
    topics: FaqTopic[];
    eyebrow?: string;
    title: string;
    subtitle?: string;
    support?: FaqSupport;
    labels?: Partial<FaqLabels>;
    initialTopic?: string;
}): import("react/jsx-runtime").JSX.Element;
