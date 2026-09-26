import Link from 'next/link';
import type { AnchorHTMLAttributes } from 'react';

/** Internal links go through next/link (so the base path is added); external ones open in a new tab. */
export function SmartLink({ href = '', children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith('/')) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  if (href.startsWith('#')) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
