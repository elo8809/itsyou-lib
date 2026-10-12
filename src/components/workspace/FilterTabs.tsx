import { ReactNode } from 'react';
import classNames from 'classnames/dedupe';
export interface FilterOption<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
}
export interface FilterTabsProps<T extends string> {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  variant?: 'segmented' | 'underline';
  className?: string;
}
/** A group of filter buttons, not an ARIA tablist: selection updates data rather than focus. */
export default function FilterTabs<T extends string>({
  label,
  value,
  options,
  onChange,
  variant = 'segmented',
  className,
}: FilterTabsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={classNames(
        'ui-filter-tabs',
        variant === 'underline' &&
          'ui-filter-tabs-underline',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          className="ui-filter-chip"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}{' '}
          {option.count !== undefined && (
            <span>{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
