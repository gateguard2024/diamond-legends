import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Diamond Legends — Carl & Austin',
  description: 'Workout leaderboard and player cards for Carl (9U) and Austin (10U).',
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-sky-200 antialiased">{children}</body>
    </html>
  );
}
