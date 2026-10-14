import type { Metadata, Viewport } from 'next';
import './globals.css';
import Shell from '@/components/Shell';

export const metadata: Metadata = {
  title: 'Diamond Legends — Elite Baseball Trainer',
  description: 'Training plan, combine tracking and gamified progress for Austin and Carl.',
  appleWebApp: { capable: true, title: 'Diamond Legends', statusBarStyle: 'black-translucent' },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0E1A2B',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink font-sans text-chalk antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
