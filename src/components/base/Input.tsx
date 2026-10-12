import React, {
  forwardRef,
  InputHTMLAttributes,
  useId,
} from 'react';
import classNames from 'classnames/dedupe';
import Icon, { IconType } from './Icon';
import InputWrapper from './InputWrapper';
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconType;
  wrapperClassName?: string;
  label?: string;
  error?: string;
  hideError?: boolean;
}
export default forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      icon,
      className,
      label,
      wrapperClassName,
      error,
      hideError,
      id,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    return (
      <InputWrapper
        error={error}
        label={label}
        htmlFor={inputId}
        errorId={errorId}
        className={wrapperClassName}
        hideError={hideError}
      >
        <div className="ui-input-icon-wrap">
          {icon && (
            <Icon
              name={icon}
              size={18}
              aria-hidden="true"
            />
          )}
          <input
            {...rest}
            id={inputId}
            ref={ref}
            aria-invalid={
              error ? true : rest['aria-invalid']
            }
            aria-describedby={
              [
                rest['aria-describedby'],
                error && !hideError ? errorId : '',
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            className={classNames(
              'ui-input border rounded-md w-full min-h-10',
              icon ? 'ui-input-with-icon' : '',
              className,
            )}
          />
        </div>
      </InputWrapper>
    );
  },
);
