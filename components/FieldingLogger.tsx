'use client';

import React, { useMemo } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { DrillId, FieldingRep } from '@/lib/types';
import { DRILLS, emptyRep, isRepFilled, repCatchPct, repThrowPct } from '@/lib/fielding';

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `fr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

export default function FieldingLogger({
  reps,
  onChange,
}: {
  reps: FieldingRep[];
  onChange: (next: FieldingRep[]) => void;
}) {
  const filled = useMemo(() => reps.filter(isRepFilled), [reps]);

  const totals = useMemo(
    () => ({
      thrown: filled.reduce((s, r) => s + r.thrown, 0),
      caught: filled.reduce((s, r) => s + r.caught, 0),
      throwsMade: filled.reduce((s, r) => s + r.throwsMade, 0),
      throwsAccurate: filled.reduce((s, r) => s + r.throwsAccurate, 0),
    }),
    [filled],
  );

  const addRep = () => {
    const last = reps[reps.length - 1];
    const nextDrill: DrillId = last
      ? DRILLS[(DRILLS.findIndex((d) => d.id === last.drill) + 1) % DRILLS.length].id
      : 'frontGrounders';
    onChange([...reps, emptyRep(newId(), nextDrill)]);
  };

  const duplicateLast = () => {
    const last = reps[reps.length - 1];
    if (!last) return addRep();
    onChange([...reps, { ...last, id: newId() }]);
  };

  const remove = (id: string) => onChange(reps.filter((r) => r.id !== id));

  const patch = (id: string, changes: Partial<FieldingRep>) =>
    onChange(reps.map((r) => (r.id === id ? { ...r, ...changes } : r)));

  const numberCell = (
    r: FieldingRep,
    key: 'thrown' | 'caught' | 'throwsMade' | 'throwsAccurate',
    label: string,
  ) => (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      aria-label={`${label} for ${r.drill}`}
      value={r[key] === 0 ? '' : String(r[key])}
      placeholder="—"
      onChange={(e) => patch(r.id, { [key]: e.target.value === '' ? 0 : Number(e.target.value) })}
      className="w-full min-w-[3.5rem] bg-slate-950 border border-sky-900 rounded-md px-1.5 py-1.5 text-white font-bold text-sm text-center focus:outline-none focus:border-sky-400 placeholder:text-slate-700"
    />
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={addRep}
          className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-cyan-300 text-slate-950 font-black text-xs px-3 py-2 rounded-lg hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> ADD DRILL LINE
        </button>
        <button
          type="button"
          onClick={duplicateLast}
          disabled={!reps.length}
          className="flex items-center gap-1.5 border border-sky-800 text-sky-300 font-bold text-xs px-3 py-2 rounded-lg hover:bg-sky-950 disabled:opacity-40"
        >
          <Copy className="w-3.5 h-3.5" /> REPEAT LAST
        </button>
      </div>

      {reps.length === 0 ? (
        <button
          type="button"
          onClick={addRep}
          className="w-full border-2 border-dashed border-sky-900 rounded-xl py-7 text-center hover:border-sky-500/60 hover:bg-sky-500/5 transition"
        >
          <Plus className="w-6 h-6 mx-auto text-sky-700 mb-1" />
          <span className="text-xs font-bold text-sky-600">
            Add a drill line — catch % and throw accuracy calculate themselves
          </span>
        </button>
      ) : (
        <div className="overflow-auto max-h-[46vh] rounded-xl border border-sky-950">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {['DRILL', 'THROWN AT HIM', 'CAUGHT', 'CATCH %', 'THROWS MADE', 'ON TARGET', 'THROW %'].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`sticky top-0 z-20 bg-slate-900 border-b border-sky-800 text-[9px] font-black text-sky-400 tracking-wider py-2 px-1 whitespace-nowrap ${
                        i === 0 ? 'text-left pl-2' : 'text-center'
                      }`}
                    >
                      {h}
                    </th>
                  ),
                )}
                <th className="sticky top-0 z-20 bg-slate-900 border-b border-sky-800 w-8" />
              </tr>
            </thead>
            <tbody>
              {reps.map((r, i) => (
                <tr key={r.id}>
                  <td className="pl-2 py-0.5">
                    <select
                      aria-label={`Line ${i + 1} drill`}
                      value={r.drill}
                      onChange={(e) => patch(r.id, { drill: e.target.value as DrillId })}
                      className="w-full min-w-[8rem] bg-slate-950 border border-sky-900 rounded-md px-1.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-sky-400"
                    >
                      {DRILLS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-1 py-0.5">{numberCell(r, 'thrown', 'Balls thrown at him')}</td>
                  <td className="px-1 py-0.5">{numberCell(r, 'caught', 'Caught cleanly')}</td>
                  <td className="px-1 py-0.5 text-center">
                    <span
                      className={`text-sm font-black ${
                        repCatchPct(r) >= 88
                          ? 'text-emerald-400'
                          : repCatchPct(r) >= 75
                            ? 'text-amber-300'
                            : 'text-slate-600'
                      }`}
                    >
                      {r.thrown ? `${repCatchPct(r)}%` : '—'}
                    </span>
                  </td>
                  <td className="px-1 py-0.5">{numberCell(r, 'throwsMade', 'Throws made')}</td>
                  <td className="px-1 py-0.5">{numberCell(r, 'throwsAccurate', 'Throws on target')}</td>
                  <td className="px-1 py-0.5 text-center">
                    <span
                      className={`text-sm font-black ${
                        repThrowPct(r) >= 85
                          ? 'text-emerald-400'
                          : repThrowPct(r) >= 70
                            ? 'text-amber-300'
                            : 'text-slate-600'
                      }`}
                    >
                      {r.throwsMade ? `${repThrowPct(r)}%` : '—'}
                    </span>
                  </td>
                  <td className="text-center py-0.5">
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      aria-label={`Delete line ${i + 1}`}
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

      {filled.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          <Summary label="CHANCES" value={totals.thrown} />
          <Summary
            label="CATCH %"
            value={`${pct(totals.caught, totals.thrown)}%`}
            highlight
          />
          <Summary label="THROWS" value={totals.throwsMade} />
          <Summary
            label="THROW ACCURACY"
            value={`${pct(totals.throwsAccurate, totals.throwsMade)}%`}
            highlight
          />
        </div>
      )}

      <p className="text-[10px] text-sky-700 mt-2.5">
        &quot;Thrown at him&quot; is every ball sent his way. &quot;On target&quot; means the throw
        was catchable at the bag.
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
        highlight ? 'border-cyan-600/50' : 'border-sky-900'
      }`}
    >
      <div className={`text-lg font-black ${highlight ? 'text-cyan-300' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[9px] text-sky-600 font-bold tracking-wider">{label}</div>
    </div>
  );
}
