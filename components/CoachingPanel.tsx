'use client';

import React from 'react';
import { AlertTriangle, ArrowDownRight, Brain, Gauge, Layers, Sparkles } from 'lucide-react';
import { Suggestion, SuggestionTag } from '@/lib/coaching';

const TAG_STYLE: Record<SuggestionTag, { cls: string; icon: React.ReactNode }> = {
  'AAA GAP': {
    cls: 'bg-amber-500/15 border-amber-500/50 text-amber-300',
    icon: <Gauge className="w-3 h-3" />,
  },
  SLIPPING: {
    cls: 'bg-rose-500/15 border-rose-500/50 text-rose-300',
    icon: <ArrowDownRight className="w-3 h-3" />,
  },
  VOLUME: {
    cls: 'bg-violet-500/15 border-violet-500/50 text-violet-300',
    icon: <Layers className="w-3 h-3" />,
  },
  SAFETY: {
    cls: 'bg-red-500/20 border-red-500/60 text-red-300',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  SHARPEN: {
    cls: 'bg-sky-500/15 border-sky-500/50 text-sky-300',
    icon: <Sparkles className="w-3 h-3" />,
  },
};

export default function CoachingPanel({
  suggestions,
  phaseLabel,
}: {
  suggestions: Suggestion[];
  phaseLabel: string;
}) {
  return (
    <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-950/60 to-sky-950/40 rounded-2xl border border-indigo-800/60">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm sm:text-base font-bold text-indigo-200 flex items-center gap-2">
          <Brain className="w-4 h-4" /> COACH&apos;S PLAN — {phaseLabel.toUpperCase()}
        </h3>
        <span className="text-[10px] text-indigo-400/70 font-bold">From the last session</span>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-xs text-indigo-300/70 py-4 text-center">
          Log a {phaseLabel.toLowerCase()} session and the plan for the next one shows up here.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {suggestions.map((s, i) => {
            const style = TAG_STYLE[s.tag];
            return (
              <li
                key={s.id}
                className="bg-slate-950/70 border border-indigo-900/70 rounded-xl p-3.5"
              >
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 w-6 h-6 rounded-lg bg-indigo-800 text-white text-xs font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-black text-white leading-tight">{s.headline}</h4>
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-full border ${style.cls}`}
                      >
                        {style.icon}
                        {s.tag}
                      </span>
                    </div>

                    <p className="text-[11px] text-sky-300/90 leading-snug mb-2.5">{s.why}</p>

                    <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-lg p-2.5 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[9px] font-black text-indigo-400 tracking-wider">
                          DRILL
                        </span>
                        <span className="text-xs font-black text-indigo-100">{s.drill}</span>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[9px] font-black text-indigo-400 tracking-wider">
                          DO
                        </span>
                        <span className="text-[11px] font-bold text-sky-200">{s.prescription}</span>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[9px] font-black text-indigo-400 tracking-wider">
                          SAY
                        </span>
                        <span className="text-[11px] italic text-amber-200/90">{s.cue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
