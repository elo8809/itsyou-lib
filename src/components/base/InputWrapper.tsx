import React, { ReactNode } from 'react';
import classNames from 'classnames/dedupe';
import Icon from './Icon';
import { InfoTooltip, Tooltip } from '../index';

const InputWrapper = ({
  label,
  htmlFor,
  errorId,
  children,
  className,
  error,
  hideError,
  info,
  toolTipWrapperClassName,
  toolTipHeaderClassName,
  toolTipContentClassName,
}: {
  children: ReactNode;
  label?: string;
  htmlFor?: string;
  errorId?: string;
  className?: string;
  error?: string;
  hideError?: boolean;
  info?: { title: string; toolTip: ReactNode };
  toolTipHeaderClassName?: string;
  toolTipWrapperClassName?: string;
  toolTipContentClassName?: string;
}) => {
  return (
    <div className={classNames('space-y-2', className)}>
      {((label !== undefined && label !== null) ||
        info) && (
        <div className={'flex space-x-1.5'}>
          {label !== undefined && label !== null && (
            <label
              htmlFor={htmlFor}
              className={'ui-field-label'}
            >
              {label}
            </label>
          )}
          {info && (
            <InfoTooltip size={16} anchor={'top start'}>
              <Tooltip
                title={info.title}
                wrapperClassName={toolTipWrapperClassName}
                headerClassName={toolTipHeaderClassName}
              >
                <div
                  className={classNames(
                    toolTipContentClassName,
                    'font-light',
                  )}
                >
                  {info.toolTip}
                </div>
              </Tooltip>
            </InfoTooltip>
          )}
        </div>
      )}
      <div className={'space-y-1'}>
        {children}
        {!hideError && (
          <div
            id={errorId}
            role={error ? 'alert' : undefined}
            aria-hidden={!error}
            className={classNames(
              'font-medium text-red-600 flex space-x-1 items-center invisible h-4',
              {
                '!visible': error,
              },
            )}
          >
            <Icon size={16} name={'Info'} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputWrapper;
