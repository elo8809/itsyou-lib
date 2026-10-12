import React from 'react';
import classNames from 'classnames/dedupe';
import Link from 'next/link';
import Icon, { IconType } from './Icon';
import Loader from './Loader';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  filled?: boolean;
  styleType?: 'dark' | 'light';
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  target?: string;
  rel?: string;
  icon?: IconType;
  trailingIcon?: IconType;
  wrapperClassName?: string;
  iconClassName?: string;
  isLoading?: boolean;
}
export default function Button({
  styleType = 'dark',
  variant,
  size = 'md',
  children,
  className,
  wrapperClassName,
  icon,
  trailingIcon,
  href,
  isLoading,
  iconClassName,
  disabled,
  filled: _filled,
  ...rest
}: ButtonProps) {
  const tone =
    variant ||
    (styleType === 'dark' ? 'primary' : 'secondary');
  const inactive = !!disabled || !!isLoading;
  const classes = classNames(
    'ui-button w-full min-w-20 py-2 border shadow-sm rounded-md font-medium',
    {
      'bg-primary text-white border-dark hover:bg-dark/80':
        tone === 'primary',
      'bg-white text-gray-700 hover:bg-gray-50':
        tone === 'secondary',
      'opacity-50': inactive,
    },
    className,
  );
  const content = (
    <>
      <span
        className="ui-button-content"
        data-loading={!!isLoading}
      >
        {icon && (
          <Icon
            className={iconClassName}
            size={18}
            name={icon}
          />
        )}
        <span>{children}</span>
        {trailingIcon && (
          <Icon size={16} name={trailingIcon} />
        )}
      </span>
      {isLoading && (
        <span
          className="ui-button-loader"
          aria-hidden="true"
        >
          <Loader
            color={tone === 'primary' ? 'light' : 'dark'}
          />
        </span>
      )}
    </>
  );
  return (
    <div className={classNames('flex', wrapperClassName)}>
      {href ? (
        <Link
          {...(rest as unknown as Omit<
            React.AnchorHTMLAttributes<HTMLAnchorElement>,
            'href'
          >)}
          href={href}
          className={classes}
          data-variant={tone}
          data-size={size}
          aria-disabled={inactive || undefined}
          aria-busy={isLoading || undefined}
          tabIndex={inactive ? -1 : rest.tabIndex}
          onClick={(e) => {
            if (inactive) {
              e.preventDefault();
              return;
            }
            (
              rest.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>
            )?.(e);
          }}
        >
          {content}
        </Link>
      ) : (
        <button
          {...rest}
          disabled={inactive}
          aria-busy={isLoading || undefined}
          className={classes}
          data-variant={tone}
          data-size={size}
        >
          {content}
        </button>
      )}
    </div>
  );
}
