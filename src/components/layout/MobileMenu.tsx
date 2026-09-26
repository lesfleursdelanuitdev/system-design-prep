'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { OutlineUnit } from '@/lib/content';
import { IconClose, IconMenu } from '../icons';
import { CourseNav } from './CourseNav';
import { SITE_LINKS } from './links';

/** Phone and tablet menu: a drawer from the left with the site links and the course contents. */
export function MobileMenu({ outline }: { outline: OutlineUnit[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const close = () => ref.current?.close();

  useEffect(() => {
    ref.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm h-9 w-9 !px-0 text-xl lg:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        <IconMenu />
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-[min(22rem,88vw)] max-w-none border-r border-line bg-bg p-0 text-fg shadow-2xl backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line px-4">
            <span className="font-bold">Menu</span>
            <button type="button" className="btn btn-ghost btn-sm h-9 w-9 !px-0 text-xl" aria-label="Close menu" onClick={close}>
              <IconClose />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav aria-label="Site" className="mb-5">
              <ul className="grid grid-cols-2 gap-2">
                {SITE_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} onClick={close} className="block rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <CourseNav outline={outline} onNavigate={close} />
          </div>
        </div>
      </dialog>
    </>
  );
}
