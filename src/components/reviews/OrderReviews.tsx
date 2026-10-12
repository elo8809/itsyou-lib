import { useEffect, useState } from 'react';
import Button from '../base/Button';
import Icon from '../base/Icon';
import { FormField } from '../workspace/FormField';
import {
  Badge,
  EmptyState,
  InlineNotice,
  Skeleton,
} from '../workspace/Feedback';
import StarRating from './StarRating';

type Review = {
  id: string;
  modelName: string;
  direction: 'CLIENT_TO_MODEL' | 'MODEL_TO_CLIENT';
  stars: number | null;
  comment: string | null;
  submittedAt: string | null;
  canSubmit: boolean;
};
type ReviewData = {
  order: {
    id: string;
    project: string;
    clientName: string;
  };
  audience: 'staff' | 'client' | 'model';
  reviews: Review[];
};
const copy = {
  de: {
    loading: 'Bewertungen werden geladen',
    error: 'Bewertungen konnten nicht geladen werden.',
    retry: 'Erneut versuchen',
    empty: 'Noch keine Bewertungen',
    emptyDescription:
      'Sobald die Rechnung für den Auftrag erstellt wurde, werden die gebuchten Models und der Kunde zur Bewertung eingeladen.',
    clientTitle: 'Wie war die Zusammenarbeit?',
    modelTitle: 'Wie war dein Auftrag?',
    staffTitle: 'Feedback zum Auftrag',
    clientDescription:
      'Bewerten Sie jedes gebuchte Model einzeln. Ihre Erfahrung hilft uns bei künftigen Buchungen.',
    modelDescription:
      'Bewerte die Zusammenarbeit mit dem Kunden und deine Erfahrung bei diesem Auftrag.',
    staffDescription:
      'Bewertungen der gebuchten Models und des Kunden, an einem Ort.',
    privacy:
      'Nur du und das Agenturteam können deine Bewertung und deinen Text lesen.',
    clientPrivacy:
      'Nur Sie und das Agenturteam können Ihre Bewertung und Ihren Text lesen.',
    rating: 'Ihre Bewertung',
    modelRating: 'Deine Bewertung',
    note: 'Feedback (optional)',
    placeholder: 'Was lief gut? Was könnte besser sein?',
    save: 'Bewertung abgeben',
    saved: 'Bewertung abgegeben',
    pending: 'Noch offen',
    teamSaved:
      'Bereits von Ihrem Team bewertet. Der Inhalt ist nur für die bewertende Person und die Agentur sichtbar.',
    noComment: 'Kein Text hinzugefügt.',
    clientToModel: 'Kunde → Model',
    modelToClient: 'Model → Kunde / Auftrag',
    completed: 'abgegeben',
    of: 'von',
    scale: '1 = sehr schlecht · 5 = ausgezeichnet',
    submitError:
      'Die Bewertung konnte nicht gespeichert werden. Bitte versuche es erneut.',
  },
  en: {
    loading: 'Loading reviews',
    error: 'Reviews could not be loaded.',
    retry: 'Try again',
    empty: 'No reviews yet',
    emptyDescription:
      'Creating the order invoice invites the booked models and the client to leave their feedback.',
    clientTitle: 'How was the collaboration?',
    modelTitle: 'How was your job?',
    staffTitle: 'Order feedback',
    clientDescription:
      'Rate each booked model individually. Your experience helps with future bookings.',
    modelDescription:
      'Rate working with the client and your experience on this job.',
    staffDescription:
      'Feedback from the booked models and the client, in one place.',
    privacy:
      'Only you and the agency team can read your rating and feedback.',
    clientPrivacy:
      'Only you and the agency team can read your rating and feedback.',
    rating: 'Your rating',
    modelRating: 'Your rating',
    note: 'Feedback (optional)',
    placeholder: 'What went well? What could be better?',
    save: 'Submit review',
    saved: 'Review submitted',
    pending: 'Awaiting review',
    teamSaved:
      'Already reviewed by your team. Only the reviewer and the agency can read the feedback.',
    noComment: 'No written feedback.',
    clientToModel: 'Client → model',
    modelToClient: 'Model → client / job',
    completed: 'submitted',
    of: 'of',
    scale: '1 = very poor · 5 = excellent',
    submitError:
      'Your review could not be saved. Please try again.',
  },
};

async function requestReviews(
  url: string,
  fallback: string,
  body?: object,
  signal?: AbortSignal,
): Promise<ReviewData> {
  const response = await fetch(url, {
    credentials: 'include',
    cache: 'no-store',
    signal,
    ...(body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(data?.message || fallback);
  return data;
}

function ReviewCard({
  review,
  data,
  url,
  onSaved,
  locale,
}: {
  review: Review;
  data: ReviewData;
  url: string;
  onSaved: (data: ReviewData) => void;
  locale: 'de' | 'en';
}) {
  const t = copy[locale];
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const staff = data.audience === 'staff';
  const model = data.audience === 'model';
  const title = model
    ? data.order.clientName
    : review.modelName;
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stars || busy) return;
    setBusy(true);
    setError('');
    try {
      onSaved(
        await requestReviews(url, t.submitError, {
          orderId: data.order.id,
          reviewId: review.id,
          stars,
          comment,
        }),
      );
      window.dispatchEvent(
        new CustomEvent('itsyou:notifications-changed', {
          detail: `${url.replace(/\/order-reviews$/, '')}/notifications/${data.audience}`,
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.submitError,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="ui-review-card">
      <header className="ui-review-card-header">
        <span
          className="ui-review-avatar"
          aria-hidden="true"
        >
          {model ? (
            <Icon name="Company" size={22} />
          ) : (
            review.modelName
              .split(' ')
              .slice(0, 2)
              .map((s) => s[0])
              .join('')
          )}
        </span>
        <div>
          <h3>{title}</h3>
          <p>
            {staff
              ? review.direction === 'CLIENT_TO_MODEL'
                ? t.clientToModel
                : t.modelToClient
              : data.order.project}
          </p>
        </div>
        <Badge
          tone={review.submittedAt ? 'complete' : 'neutral'}
        >
          {review.submittedAt ? t.saved : t.pending}
        </Badge>
      </header>
      {review.submittedAt ? (
        <div className="ui-review-result" role="status">
          {review.stars ? (
            <>
              <div className="ui-review-score">
                <StarRating
                  value={review.stars}
                  label={t.rating}
                  locale={locale}
                />
                <strong>{review.stars} / 5</strong>
              </div>
              <p className="ui-review-comment">
                {review.comment || t.noComment}
              </p>
              <time dateTime={review.submittedAt}>
                {new Date(
                  review.submittedAt,
                ).toLocaleDateString(
                  locale === 'de' ? 'de-DE' : 'en-GB',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  },
                )}
              </time>
            </>
          ) : (
            <p>{t.teamSaved}</p>
          )}
        </div>
      ) : review.canSubmit ? (
        <form onSubmit={save} className="ui-review-form">
          <StarRating
            value={stars}
            onChange={setStars}
            disabled={busy}
            label={model ? t.modelRating : t.rating}
            locale={locale}
          />
          <p className="ui-review-scale">{t.scale}</p>
          <FormField
            label={t.note}
            hint={`${comment.length} / 2.000`}
          >
            <textarea
              className="ui-input"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              placeholder={t.placeholder}
              disabled={busy}
            />
          </FormField>
          {error && (
            <InlineNotice tone="error">
              {error}
            </InlineNotice>
          )}
          <div className="ui-review-submit">
            <Button
              type="submit"
              disabled={!stars}
              isLoading={busy}
            >
              {t.save}
            </Button>
          </div>
        </form>
      ) : (
        <p className="ui-review-awaiting">{t.pending}</p>
      )}
    </article>
  );
}

export default function OrderReviews({
  apiBaseUrl,
  orderId,
  locale = 'de',
  active = true,
}: {
  apiBaseUrl: string;
  orderId: string;
  locale?: 'de' | 'en';
  active?: boolean;
}) {
  return (
    <ReviewsWorkspace
      key={`${apiBaseUrl}:${orderId}`}
      apiBaseUrl={apiBaseUrl}
      orderId={orderId}
      locale={locale}
      active={active}
    />
  );
}
function ReviewsWorkspace({
  apiBaseUrl,
  orderId,
  locale,
  active,
}: {
  apiBaseUrl: string;
  orderId: string;
  locale: 'de' | 'en';
  active: boolean;
}) {
  const t = copy[locale];
  const url = `${apiBaseUrl.replace(/\/$/, '')}/order-reviews`;
  const [data, setData] = useState<ReviewData | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!active) return;
    const abort = new AbortController();
    requestReviews(
      `${url}?orderId=${encodeURIComponent(orderId)}`,
      t.error,
      undefined,
      abort.signal,
    )
      .then((next) => {
        if (!abort.signal.aborted) {
          setData(next);
          setError('');
        }
      })
      .catch((err) => {
        if (!abort.signal.aborted)
          setError(err.message || t.error);
      });
    return () => abort.abort();
  }, [url, orderId, revision, active, t.error]);
  if (!data)
    return error ? (
      <EmptyState
        icon="Star"
        title={error}
        action={
          <Button onClick={() => setRevision((r) => r + 1)}>
            {t.retry}
          </Button>
        }
      />
    ) : (
      <div
        role="status"
        aria-label={t.loading}
        className="ui-reviews-loading"
      >
        <Skeleton className="h-28" />
        <Skeleton className="h-80" />
      </div>
    );
  if (!data.reviews.length)
    return (
      <EmptyState
        icon="Star"
        title={t.empty}
        description={t.emptyDescription}
      />
    );
  const staff = data.audience === 'staff';
  const model = data.audience === 'model';
  const completed = data.reviews.filter(
    (review) => review.submittedAt,
  ).length;
  return (
    <section className="ui-order-reviews">
      <header className="ui-reviews-heading">
        <div>
          <p className="ui-reviews-eyebrow">
            {data.order.project}
          </p>
          <h2>
            {staff
              ? t.staffTitle
              : model
                ? t.modelTitle
                : t.clientTitle}
          </h2>
          <p>
            {staff
              ? t.staffDescription
              : model
                ? t.modelDescription
                : t.clientDescription}
          </p>
        </div>
        <span className="ui-review-progress">
          {completed} {t.of} {data.reviews.length}{' '}
          {t.completed}
        </span>
      </header>
      {!staff && (
        <div className="ui-review-privacy">
          <Icon name="Info" size={18} />
          <p>{model ? t.privacy : t.clientPrivacy}</p>
        </div>
      )}
      {error && (
        <InlineNotice tone="error">{error}</InlineNotice>
      )}
      <div className="ui-review-grid">
        {data.reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            data={data}
            url={url}
            onSaved={setData}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
