import {
  forwardRef,
  useId,
  useMemo,
  useState,
} from 'react';
import {
  Field,
  Description,
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import classNames from 'classnames/dedupe';
import Icon from '../base/Icon';
import {
  filterSelectOptions,
  SearchSelectOption,
} from './search';

export interface SearchSelectProps {
  options: SearchSelectOption[];
  value?: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  label: string;
  name?: string;
  id?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  emptyMessage?: string;
  noResultsMessage?: string;
  loadingMessage?: string;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  toggleLabel?: string;
}

/** Controlled, keyboard-accessible selector with virtualized results for large lists. */
const SearchSelect = forwardRef<
  HTMLInputElement,
  SearchSelectProps
>(function SearchSelect(
  {
    options,
    value,
    onChange,
    onBlur,
    label,
    name,
    id,
    hint,
    error,
    placeholder = 'Search or select…',
    emptyMessage = 'No options available.',
    noResultsMessage = 'No matches. Try a different search.',
    loadingMessage = 'Loading…',
    loading,
    disabled,
    required,
    className,
    toggleLabel = 'Show options',
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const messageId = `${inputId}-message`;
  const [query, setQuery] = useState('');
  const selected =
    options.find((option) => option.value === value) ||
    null;
  const filtered = useMemo(
    () => filterSelectOptions(options, query),
    [options, query],
  );
  const results = loading ? [] : filtered;
  return (
    <Field
      disabled={disabled}
      className={classNames(
        'ui-search-select ui-form-field',
        className,
      )}
    >
      {label ? (
        <label className="ui-field-label" htmlFor={inputId}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      ) : null}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value || ''}
          disabled={disabled}
        />
      )}
      <Combobox<SearchSelectOption | null>
        value={selected}
        by="value"
        disabled={disabled}
        invalid={!!error}
        immediate
        onChange={(option) => {
          onChange(option?.value || null);
          setQuery('');
        }}
        onClose={() => setQuery('')}
        virtual={
          results.length
            ? {
                options: results,
                disabled: (option) => !!option?.disabled,
              }
            : undefined
        }
      >
        <div className="ui-search-select-control">
          <Icon
            name="Search"
            size={17}
            className="ui-search-select-icon"
            aria-hidden="true"
          />
          <ComboboxInput
            ref={ref}
            id={inputId}
            className="ui-input"
            autoComplete="off"
            displayValue={(
              option: SearchSelectOption | null,
            ) =>
              option
                ? [option.label, option.meta]
                    .filter(Boolean)
                    .join(' · ')
                : ''
            }
            onChange={(event) =>
              setQuery(event.target.value)
            }
            onBlur={onBlur}
            placeholder={placeholder}
            aria-label={label ? undefined : placeholder}
            aria-required={required}
            aria-invalid={!!error}
            aria-errormessage={
              error ? messageId : undefined
            }
          />
          <ComboboxButton
            className="ui-search-select-toggle"
            aria-label={toggleLabel}
          >
            <Icon
              name="ChevronDown"
              size={16}
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>
        <ComboboxOptions
          anchor="bottom start"
          className="ui-search-select-options"
          modal={false}
          aria-busy={loading}
        >
          {results.length ? (
            ({ option }: { option?: SearchSelectOption }) =>
              // the virtualizer can render a slot whose option is gone
              // while the filtered list shrinks, so skip empty slots
              !option ? null : (
                <ComboboxOption
                  value={option}
                  disabled={option.disabled}
                  className="ui-search-select-option"
                >
                  {({ selected: isSelected }) => (
                    <>
                      <span className="ui-search-select-option-copy">
                        <span className="ui-search-select-option-title">
                          {option.label}
                          {option.meta && (
                            <small>{option.meta}</small>
                          )}
                        </span>
                        {option.description && (
                          <span className="ui-search-select-description">
                            {option.description}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <Icon
                          name="Success"
                          size={17}
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )}
                </ComboboxOption>
              )
          ) : (
            <div
              className="ui-search-select-empty"
              role="status"
            >
              {loading
                ? loadingMessage
                : options.length
                  ? noResultsMessage
                  : emptyMessage}
            </div>
          )}
        </ComboboxOptions>
      </Combobox>
      {(error || hint) && (
        <Description
          as="span"
          id={messageId}
          className={
            error ? 'ui-field-error' : 'ui-field-hint'
          }
          role={error ? 'alert' : undefined}
        >
          {error || hint}
        </Description>
      )}
    </Field>
  );
});
export default SearchSelect;
