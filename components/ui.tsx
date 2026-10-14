'use client';
import { ReactNode, useEffect } from 'react';

export function Card({ children, className = '', accent }: { children: ReactNode; className?: string; accent?: boolean }) {
  return (
    <section className={`rounded-2xl border ${accent ? 'border-amber bg-raised' : 'border-line bg-panel'} p-4 ${className}`}>{children}</section>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`font-display text-[13px] uppercase tracking-[0.12em] text-muted ${className}`}>{children}</div>;
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="font-display text-[26px] font-semibold uppercase leading-tight tracking-wide sm:text-3xl">{children}</h1>;
}

export function Bar({ pct, color = '#F4B23E', h = 8 }: { pct: number; color?: string; h?: number }) {
  const w = Math.max(0, Math.min(100, Math.round(pct * 100)));
  return (
    <div className="w-full overflow-hidden rounded-full bg-ink" style={{ height: h }} role="progressbar" aria-valuenow={w} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

export function Button({
  children,
  onClick,
  kind = 'primary',
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'ghost' | 'quiet' | 'danger';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-amber text-ink font-semibold hover:bg-amber-soft',
    ghost: 'border border-amber text-amber hover:bg-amber/10',
    quiet: 'border border-line text-chalk hover:bg-raised',
    danger: 'border border-warn text-warn hover:bg-warn/10',
  }[kind];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[44px] rounded-xl px-4 text-[15px] transition-colors disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Pill({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span className="whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold" style={{ color, borderColor: color }}>
      {children}
    </span>
  );
}

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-panel p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-3xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wide">{title}</h2>
          <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-raised" aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type IconName = 'home' | 'calendar' | 'stopwatch' | 'chart' | 'star' | 'menu' | 'x' | 'check' | 'flame' | 'chevL' | 'chevR' | 'plus' | 'arm' | 'move' | 'trash' | 'ball' | 'book';

export function Icon({ name, size = 22, className = '' }: { name: IconName; size?: number; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconName, ReactNode> = {
    home: <path {...p} d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
    calendar: (
      <>
        <rect {...p} x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path {...p} d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
    stopwatch: (
      <>
        <circle {...p} cx="12" cy="13.5" r="7" />
        <path {...p} d="M12 13.5V10M10 3h4M18 6.5l1.5-1.5" />
      </>
    ),
    chart: <path {...p} d="M4 19V10M10 19V5M16 19v-6M2 20h20" />,
    star: <path {...p} d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />,
    menu: <path {...p} d="M4 7h16M4 12h16M4 17h16" />,
    x: <path {...p} d="M6 6l12 12M18 6L6 18" />,
    check: <path {...p} d="M5 12.5l4.5 4.5L19 7.5" />,
    flame: <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-7 1-10z" fill="currentColor" />,
    chevL: <path {...p} d="M15 5l-7 7 7 7" />,
    chevR: <path {...p} d="M9 5l7 7-7 7" />,
    plus: <path {...p} d="M12 5v14M5 12h14" />,
    arm: <path {...p} d="M4 18c3-1 5-3 6-6l2-5c.5-1.5 2.5-1.5 3 0l1 3 3 1c1.5.5 1.5 2.5 0 3l-5 2" />,
    move: <path {...p} d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />,
    trash: <path {...p} d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
    ball: (
      <>
        <circle {...p} cx="12" cy="12" r="8.5" />
        <path {...p} d="M8 5c2 4 2 10 0 14M16 5c-2 4-2 10 0 14" />
      </>
    ),
    book: <path {...p} d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      {paths[name]}
    </svg>
  );
}

export function Toast({ text, onDone }: { text: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [text, onDone]);
  if (!text) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 sm:bottom-8" role="status" aria-live="polite">
      <div className="animate-pop rounded-full bg-amber px-5 py-3 font-display text-lg font-semibold uppercase tracking-wide text-ink shadow-lg">{text}</div>
    </div>
  );
}

export function Sparkline({ values, lowerIsBetter, color = '#F4B23E' }: { values: number[]; lowerIsBetter?: boolean; color?: string }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 4) + 2;
    const n = (v - min) / span;
    const y = lowerIsBetter ? 4 + n * (h - 8) : h - 4 - n * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Trend">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3" fill={color} />
    </svg>
  );
}
