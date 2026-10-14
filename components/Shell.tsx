'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Icon } from './ui';
import { daysToTryouts } from '@/lib/calc';
import { useRecords, useTryoutDate } from '@/lib/useData';
import { getError, isSynced } from '@/lib/store';

const TABS = [
  { href: '/', label: 'Today', icon: 'home' as const },
  { href: '/plan', label: 'Plan', icon: 'calendar' as const },
  { href: '/test', label: 'Test', icon: 'stopwatch' as const },
  { href: '/stats', label: 'Stats', icon: 'chart' as const },
  { href: '/more', label: 'More', icon: 'menu' as const },
];

const DESKTOP_EXTRA = [
  { href: '/drills', label: 'Drills' },
  { href: '/badges', label: 'Badges' },
];

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const tryout = useTryoutDate();
  const { ready } = useRecords();
  const err = getError();
  const isOn = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <div className="min-h-screen bg-ink text-chalk">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-amber">
              <Icon name="ball" size={30} />
            </span>
            <span className="font-display text-xl font-bold uppercase leading-none tracking-[0.06em]">
              Diamond Legends
              <span className="mt-0.5 block font-sans text-[11px] font-normal normal-case tracking-normal text-muted">Elite Baseball Trainer</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {[...TABS.slice(0, 4), ...DESKTOP_EXTRA, TABS[4]].map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3 py-2 text-[15px] ${isOn(t.href) ? 'bg-raised font-semibold text-chalk' : 'text-muted hover:text-chalk'}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold leading-none text-amber">{daysToTryouts(tryout)}</div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-muted">days to tryouts</div>
          </div>
        </div>
        {ready && (!isSynced || err) && (
          <div className={`px-4 py-1.5 text-center text-xs ${err ? 'bg-warn/20 text-warn' : 'bg-panel text-muted'}`}>
            {err ? `Sync problem: ${err}` : 'Local only — data is saved on this device. Add Supabase keys to sync phones.'}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-4 md:pb-12">{children}</main>

      <nav
        aria-label="Tabs"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {TABS.map((t) => {
          const on = isOn(t.href);
          return (
            <Link key={t.href} href={t.href} className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11px] ${on ? 'font-semibold text-amber' : 'text-muted'}`} aria-current={on ? 'page' : undefined}>
              <Icon name={t.icon} size={24} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
