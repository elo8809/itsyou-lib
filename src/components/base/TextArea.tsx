import React, {
  forwardRef,
  useId,
  TextareaHTMLAttributes,
  PropsWithChildren,
} from 'react';
import { Textarea as TextareaUi } from '@headlessui/react';
import classNames from 'classnames/dedupe';
import InputWrapper from './InputWrapper';

export interface TextAreaProps extends PropsWithChildren<
  TextareaHTMLAttributes<HTMLTextAreaElement>
> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const TextArea_ = (
  {
    wrapperClassName,
    error,
    label,
    className,
    id,
    ...rest
  }: TextAreaProps,
  ref: any,
) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <InputWrapper
      className={wrapperClassName}
      label={label}
      htmlFor={inputId}
      error={error}
      errorId={`${inputId}-error`}
    >
      <TextareaUi
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : undefined
        }
        {...rest}
        className={classNames(
          className,
          'ui-input min-h-24 w-full rounded-md p-3',
        )}
      />
    </InputWrapper>
  );
};

const TextArea = forwardRef(TextArea_);

export default TextArea;
