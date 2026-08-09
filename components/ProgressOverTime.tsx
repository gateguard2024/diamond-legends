'use client';

import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { Goal, PlayerId, Session } from '@/lib/types';
import { METRICS, activeGoal, currentValue, metricSeries, personalBest } from '@/lib/goals';
import { LineChart } from './ui';

// Hex equivalents of each metric's Tailwind accent, for the SVG stroke.
const STROKE: Record<string, string> = {
  strikePct: '#fb923c',
  avgSpeed: '#f87171',
  topSpeed: '#fb7185',
  batSpeed: '#facc15',
  onPlaneEfficiency: '#a3e635',
  cleanPct: '#38bdf8',
  workoutsPerWeek: '#a78bfa',
};

const FILL: Record<string, string> = {
  strikePct: 'rgba(251,146,60,0.16)',
  avgSpeed: 'rgba(248,113,113,0.16)',
  topSpeed: 'rgba(251,113,133,0.16)',
  batSpeed: 'rgba(250,204,21,0.16)',
  onPlaneEfficiency: 'rgba(163,230,53,0.16)',
  cleanPct: 'rgba(56,189,248,0.16)',
  workoutsPerWeek: 'rgba(167,139,250,0.16)',
};

export default function ProgressOverTime({
  playerId,
  sessions,
  goals,
}: {
  playerId: PlayerId;
  sessions: Session[];
  goals: Goal[];
}) {
  const [metricId, setMetricId] = useState(METRICS[0].id);
  const def = METRICS.find((m) => m.id === metricId)!;

  const series = metricSeries(def, sessions);
  const goal = activeGoal(goals, playerId, def.id);
  const current = currentValue(def, sessions);
  const best = personalBest(def, sessions);

  const first = series[0]?.value;
  const latest = series[series.length - 1]?.value;
  const allTimeChange = first !== undefined && latest !== undefined ? latest - first : null;

  return (
    <div className="p-4 sm:p-5 bg-sky-950/40 rounded-2xl border border-sky-900">
      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-sky-400" /> PROGRESS OVER TIME
      </h3>

      {/* Metric picker */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMetricId(m.id)}
            className={`text-[10px] font-black tracking-wider px-2.5 py-1.5 rounded-lg border transition ${
              m.id === metricId
                ? 'bg-sky-800 border-sky-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-sky-300'
            }`}
          >
            {m.short}
          </button>
        ))}
      </div>

      <LineChart
        points={series}
        target={goal?.target ?? null}
        stroke={STROKE[def.id]}
        fill={FILL[def.id]}
        decimals={def.decimals}
        unit={def.unit}
      />

      <div className="grid grid-cols-4 gap-2 mt-4">
        <div className="bg-sky-950 border border-sky-800 rounded-lg p-2 text-center">
          <div className="text-base font-black text-white">
            {current === null ? '—' : current.toFixed(def.decimals)}
          </div>
          <div className="text-[9px] text-sky-600 font-bold tracking-wider">CURRENT AVG</div>
        </div>
        <div className="bg-sky-950 border border-sky-800 rounded-lg p-2 text-center">
          <div className="text-base font-black text-amber-300">
            {goal ? goal.target.toFixed(def.decimals) : '—'}
          </div>
          <div className="text-[9px] text-sky-600 font-bold tracking-wider">GOAL</div>
        </div>
        <div className="bg-sky-950 border border-sky-800 rounded-lg p-2 text-center">
          <div className="text-base font-black text-white">
            {best === null ? '—' : best.toFixed(def.decimals)}
          </div>
          <div className="text-[9px] text-sky-600 font-bold tracking-wider">BEST EVER</div>
        </div>
        <div className="bg-sky-950 border border-sky-800 rounded-lg p-2 text-center">
          <div
            className={`text-base font-black ${
              allTimeChange === null
                ? 'text-white'
                : allTimeChange >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
            }`}
          >
            {allTimeChange === null
              ? '—'
              : `${allTimeChange >= 0 ? '+' : ''}${allTimeChange.toFixed(def.decimals)}`}
          </div>
          <div className="text-[9px] text-sky-600 font-bold tracking-wider">SINCE START</div>
        </div>
      </div>
    </div>
  );
}
