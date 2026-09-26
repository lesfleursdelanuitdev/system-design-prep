'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_LINKS } from './links';

export function HeaderLinks() {
  const pathname = usePathname() ?? '/';
  const isActive = (href: string) => (href === '/' ? pathname === '/' || pathname.startsWith('/learn') : pathname.startsWith(href.replace(/\/$/, '')));
  return (
    <nav aria-label="Site" className="hidden lg:block">
      <ul className="flex items-center gap-1 text-[0.925rem]">
        {SITE_LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`rounded-md px-2.5 py-1.5 font-medium hover:bg-surface-2 ${isActive(l.href) ? 'text-accent' : 'text-fg/80'}`}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
