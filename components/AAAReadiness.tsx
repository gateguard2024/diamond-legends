'use client';

import React from 'react';
import { Info, Trophy } from 'lucide-react';
import { LEVELS, LevelId, ReadinessResult } from '@/lib/benchmarks';
import { Phase } from '@/lib/types';

const LEVEL_STYLE: Record<LevelId, string> = {
  rec: 'bg-slate-700 text-slate-200',
  aa: 'bg-sky-600 text-white',
  aaa: 'bg-amber-500 text-slate-950',
  elite: 'bg-fuchsia-500 text-white',
};

/**
 * "How close are we to AAA?" — a single score plus the per-metric gaps,
 * furthest-away first.
 */
export default function AAAReadiness({
  readiness,
  phase,
}: {
  readiness: ReadinessResult;
  /** Show only one phase's rows, or all of them. */
  phase?: Phase;
}) {
  const rows = phase
    ? readiness.gaps.filter((g) => g.benchmark.phase === phase)
    : readiness.gaps;

  if (!rows.length) return null;

  // Recompute the headline score for just the rows on screen.
  const score = Math.round((rows.reduce((s, r) => s + r.progress, 0) / rows.length) * 100);
  const cleared = rows.filter((r) => r.progress >= 1).length;

  return (
    <div className="p-4 sm:p-5 bg-sky-950/40 rounded-2xl border border-amber-800/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
          <Trophy className="w-4 h-4" /> AAA READINESS
        </h3>
        <span
          className="text-[10px] text-sky-600 font-bold flex items-center gap-1"
          title="These are coaching rules of thumb for 9-10 year olds, not official standards. Edit them in lib/benchmarks.ts."
        >
          <Info className="w-3 h-3" /> 9U / 10U guide
        </span>
      </div>

      {/* Headline score */}
      <div className="flex items-center gap-4 mb-4">
        <div className="shrink-0 text-center">
          <div className="text-3xl font-black text-white leading-none">{score}%</div>
          <div className="text-[9px] text-sky-600 font-bold tracking-wider mt-1">TO AAA</div>
        </div>
        <div className="flex-1">
          <div className="h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-amber-400 to-amber-300 rounded-full transition-all duration-700"
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-[10px] text-sky-500 font-bold mt-1.5">
            {cleared} of {rows.length} metrics at or above the AAA line
          </p>
        </div>
      </div>

      {/* Per-metric rows, furthest from AAA first */}
      <div className="space-y-2">
        {rows.map(({ benchmark: b, value, progress, gap, level }) => (
          <div key={b.metric} className="bg-slate-950/70 border border-sky-900 rounded-xl p-2.5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-black text-white">{b.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-black text-white tabular-nums">
                  {value.toFixed(b.decimals)}
                  <span className="text-sky-600 font-bold"> {b.unit}</span>
                </span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    level ? LEVEL_STYLE[level] : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {level ? LEVELS.find((l) => l.id === level)?.label : 'BUILDING'}
                </span>
              </div>
            </div>

            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  progress >= 1
                    ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                    : 'bg-gradient-to-r from-sky-600 to-sky-400'
                }`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>

            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-sky-700 font-bold">
                AAA {b.aaa}
                {b.unit}
              </span>
              <span
                className={`text-[9px] font-black ${gap <= 0 ? 'text-amber-300' : 'text-sky-500'}`}
              >
                {gap <= 0
                  ? 'AAA CLEARED ✓'
                  : `${gap.toFixed(b.decimals)}${b.unit} to go`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
