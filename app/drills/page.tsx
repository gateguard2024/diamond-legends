'use client';
import { useState } from 'react';
import { Card, H1 } from '@/components/ui';
import { DRILLS, DrillCat } from '@/lib/program';

const CATS: (DrillCat | 'All')[] = ['All', 'Hitting', 'Throwing', 'Fielding', 'Strength', 'Speed', 'Mobility'];

export default function DrillsPage() {
  const [cat, setCat] = useState<DrillCat | 'All'>('All');
  const list = DRILLS.filter((d) => cat === 'All' || d.cat === cat);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <H1>Drill library</H1>
      <p className="text-sm text-muted">&ldquo;Max&rdquo; means full effort on every rep with 30–60 s rest. Stop the set when speed or form drops.</p>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Category">
        {CATS.map((c) => (
          <button key={c} role="tab" aria-selected={c === cat} onClick={() => setCat(c)} className={`min-h-[40px] flex-none rounded-full border px-4 text-sm ${c === cat ? 'border-amber bg-amber font-semibold text-ink' : 'border-line text-muted'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((d) => (
          <Card key={d.id} className="!p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold">{d.name}</div>
              <span className="whitespace-nowrap text-xs text-muted">
                {d.cat} · {d.who}
              </span>
            </div>
            <div className="mt-1 text-sm text-amber">{d.dose}</div>
            <div className="mt-1 text-sm text-muted">{d.cue}</div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted">No weighted-ball throwing programs at this age unless a qualified pitching coach runs them. Fastballs and changeups only.</p>
    </div>
  );
}
