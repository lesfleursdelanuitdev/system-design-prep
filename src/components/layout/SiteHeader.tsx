import Link from 'next/link';
import type { OutlineUnit } from '@/lib/content';
import { IconShelf } from '../icons';
import { HeaderLinks } from './HeaderLinks';
import { MobileMenu } from './MobileMenu';
import { SearchDialog } from './SearchDialog';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader({ outline }: { outline: OutlineUnit[] }) {
  return (
    <header className="sticky top-0 z-30 h-[var(--header-h)] border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-full max-w-[90rem] items-center gap-2 px-3 sm:px-5">
        <MobileMenu outline={outline} />
        <Link href="/" className="mr-2 flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg text-on-accent" aria-hidden="true">
            <IconShelf />
          </span>
          <span className="leading-tight">
            <span className="hidden sm:inline">System Design, in Plain English</span>
            <span className="sm:hidden">System Design</span>
          </span>
        </Link>
        <HeaderLinks />
        <div className="ml-auto flex items-center gap-1.5">
          <SearchDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
