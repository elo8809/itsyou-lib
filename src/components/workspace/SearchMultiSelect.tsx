import { useId, useMemo, useState } from 'react';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import Icon from '../base/Icon';
export type SearchMultiSelectOption = {
  id: string;
  label: string;
};

/** Searchable multi-selection with keyboard navigation and a compact summary. */
export default function SearchMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Any',
  noResultsMessage = 'No matching options.',
  toggleLabel,
}: {
  label: string;
  options: SearchMultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  noResultsMessage?: string;
  toggleLabel?: string;
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const matches = useMemo(
    () =>
      options.filter((option) =>
        normalize(`${option.label} ${option.id}`).includes(
          normalize(query),
        ),
      ),
    [options, query],
  );
  return (
    <div className="ui-form-field min-w-0">
      <label htmlFor={id} className="ui-field-label">
        {label}
      </label>
      <Combobox
        multiple
        value={value}
        onChange={(values) => {
          onChange(values);
          setQuery('');
        }}
        onClose={() => setQuery('')}
        immediate
      >
        <div className="ui-search-select-control">
          <ComboboxInput
            id={id}
            className="ui-input !pl-3 !pr-9"
            autoComplete="off"
            title={value
              .map(
                (v) =>
                  options.find((o) => o.id === v)?.label ||
                  v,
              )
              .join(', ')}
            placeholder={placeholder}
            aria-label={label}
            displayValue={(values: string[]) => {
              const labels = values.map(
                (v) =>
                  options.find((o) => o.id === v)?.label ||
                  v,
              );
              return labels.length > 1
                ? `${labels[0]} +${labels.length - 1}`
                : labels[0] || '';
            }}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />
          <ComboboxButton
            className="ui-search-select-toggle"
            aria-label={
              toggleLabel || `Choose ${label.toLowerCase()}`
            }
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
        >
          {matches.map((option) => (
            <ComboboxOption
              key={option.id}
              value={option.id}
              className="ui-search-select-option text-sm"
            >
              {({ selected }) => (
                <>
                  <span
                    className="min-w-0 flex-1 truncate"
                    title={option.label}
                  >
                    {option.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${selected ? 'bg-dark border-dark text-white' : 'border-gray-300'}`}
                  >
                    {selected ? '✓' : ''}
                  </span>
                </>
              )}
            </ComboboxOption>
          ))}
          {!matches.length && (
            <p
              className="ui-search-select-empty"
              role="status"
            >
              {noResultsMessage}
            </p>
          )}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
