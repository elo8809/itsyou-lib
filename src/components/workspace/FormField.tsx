import {
  cloneElement,
  isValidElement,
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  useId,
} from 'react';
import classNames from 'classnames/dedupe';
import Panel from './Panel';
export const inputClass = 'ui-input';
export function FormField({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const child = isValidElement<
    InputHTMLAttributes<HTMLInputElement>
  >(children)
    ? children
    : null;
  const id = child?.props.id || generatedId;
  const messageId = `${id}-message`;
  return (
    <div className={classNames('ui-form-field', className)}>
      <label htmlFor={id} className="ui-field-label">
        {label}
      </label>
      {child
        ? cloneElement(child, {
            id,
            'aria-invalid': error
              ? true
              : child.props['aria-invalid'],
            'aria-describedby':
              [
                child.props['aria-describedby'],
                error || hint ? messageId : '',
              ]
                .filter(Boolean)
                .join(' ') || undefined,
          })
        : children}
      {error ? (
        <span
          id={messageId}
          className="ui-field-error"
          role="alert"
        >
          {error}
        </span>
      ) : (
        hint && (
          <span id={messageId} className="ui-field-hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className, ...rest }, ref) {
  return (
    <input
      {...rest}
      ref={ref}
      className={classNames(inputClass, className)}
    />
  );
});
export interface SelectOption {
  id: string | number;
  label: ReactNode;
}
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    items: SelectOption[];
    placeholder?: string;
  }
>(function Select(
  { items, placeholder, className, ...rest },
  ref,
) {
  return (
    <select
      {...rest}
      ref={ref}
      className={classNames(inputClass, className)}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </select>
  );
});
export function FormCard({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Panel
      id={id}
      className="ui-section-anchor"
      title={title}
      description={description}
      contentClassName="ui-form-grid"
    >
      {children}
    </Panel>
  );
}
