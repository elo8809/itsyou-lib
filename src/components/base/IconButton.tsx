import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEventHandler,
} from 'react';
import Link from 'next/link';
import classNames from 'classnames/dedupe';
import Icon, { IconType } from './Icon';
import Loader from './Loader';
interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> {
  onClick?: MouseEventHandler<any>;
  icon: IconType;
  isLoading?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  iconClassName?: string;
  size?: number;
  loaderColor?: 'light' | 'dark';
}
export default function IconButton({
  onClick,
  icon,
  isLoading,
  href,
  target,
  rel,
  disabled,
  className,
  size,
  iconClassName,
  loaderColor = 'dark',
  title,
  ...rest
}: IconButtonProps) {
  const inactive = !!disabled || !!isLoading;
  const classes = classNames(
    'ui-icon-button border rounded bg-white',
    className,
  );
  const label = rest['aria-label'] || title || icon;
  const content = (
    <>
      <span
        className="ui-button-content"
        data-loading={!!isLoading}
      >
        <Icon
          size={size || 18}
          name={icon}
          className={iconClassName}
          aria-hidden="true"
        />
      </span>
      {isLoading && (
        <span
          className="ui-button-loader"
          aria-hidden="true"
        >
          <Loader color={loaderColor} />
        </span>
      )}
    </>
  );
  return href ? (
    <Link
      {...(rest as unknown as AnchorHTMLAttributes<HTMLAnchorElement>)}
      href={href}
      target={target}
      rel={rel}
      title={title}
      aria-label={label}
      aria-disabled={inactive || undefined}
      aria-busy={isLoading || undefined}
      tabIndex={inactive ? -1 : rest.tabIndex}
      className={classes}
      onClick={(e) => {
        if (inactive) e.preventDefault();
        else onClick?.(e);
      }}
    >
      {content}
    </Link>
  ) : (
    <button
      {...rest}
      type={rest.type || 'button'}
      onClick={onClick}
      disabled={inactive}
      title={title}
      aria-label={label}
      aria-busy={isLoading || undefined}
      className={classes}
    >
      {content}
    </button>
  );
}
