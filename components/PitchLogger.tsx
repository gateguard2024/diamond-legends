'use client';

import React, { useMemo } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { Pitch, PitchType } from '@/lib/types';
import {
  PITCH_TYPES,
  averageSpeed,
  emptyPitch,
  longestStrikeRun,
  strikeCount,
  strikePct,
  topSpeed,
} from '@/lib/pitches';

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function PitchLogger({
  pitches,
  onChange,
}: {
  pitches: Pitch[];
  onChange: (next: Pitch[]) => void;
}) {
  const strikes = useMemo(() => strikeCount(pitches), [pitches]);

  const addPitch = (type: PitchType = 'FB') => onChange([...pitches, emptyPitch(newId(), type)]);

  const duplicateLast = () => {
    const last = pitches[pitches.length - 1];
    if (!last) return addPitch();
    onChange([...pitches, { ...last, id: newId() }]);
  };

  const remove = (id: string) => onChange(pitches.filter((p) => p.id !== id));

  const patch = (id: string, changes: Partial<Pitch>) =>
    onChange(pitches.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => addPitch()}
          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-300 text-slate-950 font-black text-xs px-3 py-2 rounded-lg hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> ADD PITCH
        </button>
        <button
          type="button"
          onClick={duplicateLast}
          disabled={!pitches.length}
          title="Copy the last pitch into a new line"
          className="flex items-center gap-1.5 border border-sky-800 text-sky-300 font-bold text-xs px-3 py-2 rounded-lg hover:bg-sky-950 disabled:opacity-40"
        >
          <Copy className="w-3.5 h-3.5" /> REPEAT LAST
        </button>
        {pitches.length > 0 && (
          <span className="ml-auto text-[10px] font-black text-sky-500 tracking-wider">
            {strikes}/{pitches.length} STRIKES · {strikePct(pitches)}%
          </span>
        )}
      </div>

      {pitches.length === 0 ? (
        <button
          type="button"
          onClick={() => addPitch()}
          className="w-full border-2 border-dashed border-sky-900 rounded-xl py-7 text-center hover:border-orange-500/60 hover:bg-orange-500/5 transition"
        >
          <Plus className="w-6 h-6 mx-auto text-sky-700 mb-1" />
          <span className="text-xs font-bold text-sky-600">
            Add the first pitch — totals and velo averages build themselves
          </span>
        </button>
      ) : (
        <div className="overflow-auto max-h-[46vh] rounded-xl border border-sky-950">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky top-0 z-20 bg-slate-900 border-b border-sky-800 text-[9px] font-black text-sky-500 tracking-wider text-left pl-2 py-2 w-8">
                  #
                </th>
                <th className="sticky top-0 z-20 bg-slate-900 border-b border-sky-800 text-[9px] font-black text-sky-400 tracking-wider text-center py-2 px-1">
                  SPEED <span className="text-sky-700">mph</span>
                </th>
                <th className="sticky top-0 z-20 bg-slate-900 border-b border-sky-800 text-[9px] font-black text-sky-400 tracking-wider text-center py-2 px-1">
                  TYPE
                </th>
                <th className="sticky top-0 z-20 bg-slate-900 border-b border-sky-800 text-[9px] font-black text-sky-400 tracking-wider text-center py-2 px-1">
                  RESULT
                </th>
                <th className="sticky top-0 z-20 bg-slate-900 border-b border-sky-800 w-8" />
              </tr>
            </thead>
            <tbody>
              {pitches.map((p, i) => (
                <tr key={p.id}>
                  <td className="text-[11px] font-black text-sky-500 pl-2 py-0.5 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-1 py-0.5">
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      aria-label={`Pitch ${i + 1} speed`}
                      value={p.speed === 0 ? '' : String(p.speed)}
                      placeholder="—"
                      onChange={(e) =>
                        patch(p.id, { speed: e.target.value === '' ? 0 : Number(e.target.value) })
                      }
                      className="w-full min-w-[4.5rem] bg-slate-950 border border-sky-900 rounded-md px-1.5 py-1.5 text-white font-bold text-sm text-center focus:outline-none focus:border-orange-400 placeholder:text-slate-700"
                    />
                  </td>
                  <td className="px-1 py-0.5">
                    <select
                      aria-label={`Pitch ${i + 1} type`}
                      value={p.type}
                      onChange={(e) => patch(p.id, { type: e.target.value as PitchType })}
                      className="w-full bg-slate-950 border border-sky-900 rounded-md px-1.5 py-1.5 text-white font-bold text-sm text-center focus:outline-none focus:border-orange-400"
                    >
                      {PITCH_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.short}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-1 py-0.5">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => patch(p.id, { strike: true })}
                        className={`flex-1 rounded-md py-1.5 text-xs font-black transition ${
                          p.strike
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-950 border border-sky-900 text-slate-500 hover:text-emerald-300'
                        }`}
                      >
                        STRIKE
                      </button>
                      <button
                        type="button"
                        onClick={() => patch(p.id, { strike: false })}
                        className={`flex-1 rounded-md py-1.5 text-xs font-black transition ${
                          !p.strike
                            ? 'bg-rose-500 text-slate-950'
                            : 'bg-slate-950 border border-sky-900 text-slate-500 hover:text-rose-300'
                        }`}
                      >
                        BALL
                      </button>
                    </div>
                  </td>
                  <td className="text-center py-0.5">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      aria-label={`Delete pitch ${i + 1}`}
                      className="text-slate-700 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pitches.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
          <Summary label="PITCHES" value={pitches.length} />
          <Summary label="STRIKE %" value={`${strikePct(pitches)}%`} />
          <Summary label="AVG VELO" value={averageSpeed(pitches).toFixed(1)} />
          <Summary label="TOP VELO" value={topSpeed(pitches).toFixed(1)} highlight />
          <Summary label="BEST RUN" value={longestStrikeRun(pitches)} />
        </div>
      )}

      <p className="text-[10px] text-sky-700 mt-2.5">
        Leave speed blank for pitches you didn&apos;t gun — they still count toward strike %.
      </p>
    </div>
  );
}

function Summary({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-slate-950 border rounded-lg p-2 text-center ${
        highlight ? 'border-amber-600/50' : 'border-sky-900'
      }`}
    >
      <div className={`text-lg font-black ${highlight ? 'text-amber-300' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[9px] text-sky-600 font-bold tracking-wider">{label}</div>
    </div>
  );
}
