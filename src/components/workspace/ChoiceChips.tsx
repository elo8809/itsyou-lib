import { ReactNode } from 'react';
import Icon from '../base/Icon';
export default function ChoiceChips({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: string; label: ReactNode }[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="ui-choice-chips"
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            type="button"
            key={option.value}
            disabled={disabled}
            aria-pressed={selected}
            className="ui-choice-chip"
            onClick={() =>
              onChange(
                selected
                  ? value.filter((v) => v !== option.value)
                  : [...value, option.value],
              )
            }
          >
            <span className="ui-choice-chip-mark">
              {selected && (
                <Icon
                  name="Success"
                  size={12}
                  aria-hidden="true"
                />
              )}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
