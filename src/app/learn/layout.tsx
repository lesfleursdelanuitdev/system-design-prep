import { CourseNav } from '@/components/layout/CourseNav';
import { getOutline } from '@/lib/content';

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const outline = getOutline();
  return (
    <div className="mx-auto flex max-w-[90rem]">
      <aside className="sticky top-[var(--header-h)] hidden h-[calc(100dvh-var(--header-h))] w-72 shrink-0 overflow-y-auto border-r border-line px-3 py-6 lg:block xl:w-80">
        <CourseNav outline={outline} />
      </aside>
      <main id="main" className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-8 lg:px-12 lg:pt-10">
        {children}
      </main>
    </div>
  );
}
