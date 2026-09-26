import type { Metadata, Viewport } from 'next';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { getOutline } from '@/lib/content';
import { themeScript } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'System Design, in Plain English', template: '%s · System Design, in Plain English' },
  description: 'Learn to design a system before you build it: requirements, contracts, diagrams and trade-offs, in plain English, with one running example.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f6' },
    { media: '(prefers-color-scheme: dark)', color: '#111316' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const outline = getOutline();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader outline={outline} />
        {children}
      </body>
    </html>
  );
}
