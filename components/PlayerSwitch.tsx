'use client';
import { PLAYERS, PlayerId } from '@/lib/program';

export default function PlayerSwitch({ value, onChange }: { value: PlayerId; onChange: (id: PlayerId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-panel p-1.5" role="radiogroup" aria-label="Player">
      {PLAYERS.map((p) => {
        const on = p.id === value;
        return (
          <button
            key={p.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p.id)}
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl font-display text-lg font-semibold uppercase tracking-wide transition-colors ${
              on ? 'bg-raised text-chalk' : 'text-muted hover:text-chalk'
            }`}
            style={on ? { boxShadow: `inset 0 0 0 2px ${p.color}` } : undefined}
          >
            <span className="grid h-7 w-7 place-items-center rounded-full font-mono text-sm" style={{ background: on ? p.color : 'transparent', color: on ? '#0E1A2B' : p.color, border: `1.5px solid ${p.color}` }}>
              {p.number}
            </span>
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
