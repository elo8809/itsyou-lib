import { useId } from 'react';
import Icon from '../base/Icon';

/** Native radio controls keep star selection usable by keyboard and touch. */
export default function StarRating({
  value,
  onChange,
  disabled,
  label,
  locale = 'de',
}: {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  label: string;
  locale?: 'de' | 'en';
}) {
  const name = useId();
  const ratingLabel = (rating: number) =>
    locale === 'de'
      ? `${rating} von 5 Sternen`
      : `${rating} out of 5 stars`;
  if (!onChange)
    return (
      <span
        className="ui-star-rating"
        role="img"
        aria-label={ratingLabel(value)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            size={22}
            fill={star <= value ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  return (
    <fieldset
      className="ui-star-rating-field"
      disabled={disabled}
    >
      <legend className="ui-field-label">{label}</legend>
      <div
        className="ui-star-rating"
        role="radiogroup"
        aria-label={label}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            className="ui-star-choice"
            data-selected={star <= value}
          >
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              aria-label={ratingLabel(star)}
              required
            />
            <Icon
              name="Star"
              size={29}
              fill={star <= value ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </label>
        ))}
        <span
          className="ui-rating-value"
          aria-live="polite"
        >
          {value ? `${value} / 5` : '— / 5'}
        </span>
      </div>
    </fieldset>
  );
}
