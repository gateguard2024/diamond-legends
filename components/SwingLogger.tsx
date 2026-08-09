'use client';

import React, { useMemo } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { Swing, SwingMetric } from '@/lib/types';
import {
  SWING_COLUMNS,
  averageMetric,
  bestMetric,
  emptySwing,
  isSwingFilled,
  metricCount,
} from '@/lib/swings';

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `sw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function SwingLogger({
  swings,
  onChange,
  showAll,
  onToggleColumns,
}: {
  swings: Swing[];
  onChange: (next: Swing[]) => void;
  showAll: boolean;
  onToggleColumns: () => void;
}) {
  const columns = useMemo(() => SWING_COLUMNS.filter((c) => showAll || c.core), [showAll]);
  const filled = useMemo(() => swings.filter(isSwingFilled), [swings]);

  const addSwing = () => onChange([...swings, emptySwing(newId())]);

  const duplicateLast = () => {
    const last = swings[swings.length - 1];
    if (!last) return addSwing();
    onChange([...swings, { ...last, id: newId() }]);
  };

  const removeSwing = (id: string) => onChange(swings.filter((s) => s.id !== id));

  const setValue = (id: string, key: SwingMetric, raw: string) => {
    const value = raw === '' || raw === '-' ? 0 : Number(raw);
    onChange(
      swings.map((s) => (s.id === id ? { ...s, [key]: Number.isNaN(value) ? 0 : value } : s)),
    );
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={addSwing}
          className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-amber-300 text-slate-950 font-black text-xs px-3 py-2 rounded-lg hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> ADD SWING
        </button>
        <button
          type="button"
          onClick={duplicateLast}
          disabled={!swings.length}
          title="Copy the previous swing's numbers into a new line"
          className="flex items-center gap-1.5 border border-sky-800 text-sky-300 font-bold text-xs px-3 py-2 rounded-lg hover:bg-sky-950 disabled:opacity-40"
        >
          <Copy className="w-3.5 h-3.5" /> REPEAT LAST
        </button>
        <button
          type="button"
          onClick={onToggleColumns}
          className="ml-auto text-[10px] font-black tracking-wider text-sky-400 border border-sky-800 px-2.5 py-2 rounded-lg hover:bg-sky-950"
        >
          {showAll ? 'SHOW CORE 5' : 'SHOW ALL 11'}
        </button>
      </div>

      {swings.length === 0 ? (
        <button
          type="button"
          onClick={addSwing}
          className="w-full border-2 border-dashed border-sky-900 rounded-xl py-7 text-center hover:border-yellow-500/60 hover:bg-yellow-500/5 transition"
        >
          <Plus className="w-6 h-6 mx-auto text-sky-700 mb-1" />
          <span className="text-xs font-bold text-sky-600">
            Add the first swing — session averages build themselves
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
                {columns.map((c) => (
                  <th
                    key={c.key}
                    title={c.label}
                    className="sticky top-0 z-20 bg-slate-900 border-b border-sky-800 text-[9px] font-black text-sky-400 tracking-wider text-center py-2 px-1 whitespace-nowrap"
                  >
                    {c.short}
                    {c.unit && <span className="text-sky-700"> {c.unit}</span>}
                  </th>
                ))}
                <th className="sticky top-0 z-20 bg-slate-900 border-b border-sky-800 w-8" />
              </tr>
            </thead>
            <tbody>
              {swings.map((s, i) => (
                <tr key={s.id} className="group">
                  <td className="text-[11px] font-black text-sky-500 pl-2 py-0.5 tabular-nums">
                    {i + 1}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-0.5 py-0.5">
                      <input
                        type="number"
                        step={c.step}
                        inputMode="decimal"
                        aria-label={`Swing ${i + 1} ${c.label}`}
                        title={c.label}
                        value={s[c.key] === 0 ? '' : String(s[c.key])}
                        placeholder="—"
                        onChange={(e) => setValue(s.id, c.key, e.target.value)}
                        className="w-full min-w-[3.75rem] bg-slate-950 border border-sky-900 rounded-md px-1.5 py-1.5 text-white font-bold text-sm text-center focus:outline-none focus:border-yellow-400 placeholder:text-slate-700"
                      />
                    </td>
                  ))}
                  <td className="text-center py-0.5">
                    <button
                      type="button"
                      onClick={() => removeSwing(s.id)}
                      aria-label={`Delete swing ${i + 1}`}
                      className="text-slate-700 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Live session averages — pinned to the bottom of the scroll box */}
            {filled.length > 0 && (
              <tfoot>
                <tr>
                  <td className="sticky bottom-0 z-20 bg-slate-900 border-t border-yellow-700/50 text-[9px] font-black text-yellow-400 tracking-wider pl-2 py-1.5">
                    AVG
                  </td>
                  {columns.map((c) => {
                    const avg = averageMetric(filled, c.key);
                    const n = metricCount(filled, c.key);
                    return (
                      <td
                        key={c.key}
                        className="sticky bottom-0 z-20 bg-slate-900 border-t border-yellow-700/50 px-0.5 py-1.5"
                      >
                        <div className="bg-yellow-500/10 border border-yellow-600/40 rounded-md py-1 text-center">
                          <div className="text-sm font-black text-yellow-200 leading-none">
                            {n ? avg.toFixed(c.decimals) : '—'}
                          </div>
                          {n > 0 && n < filled.length && (
                            <div className="text-[8px] text-yellow-700 font-bold mt-0.5">
                              {n} of {filled.length}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="sticky bottom-0 z-20 bg-slate-900 border-t border-yellow-700/50" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Summary strip */}
      {filled.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-slate-950 border border-sky-900 rounded-lg p-2 text-center">
            <div className="text-lg font-black text-white">{filled.length}</div>
            <div className="text-[9px] text-sky-600 font-bold tracking-wider">SWINGS LOGGED</div>
          </div>
          <div className="bg-slate-950 border border-sky-900 rounded-lg p-2 text-center">
            <div className="text-lg font-black text-white">
              {averageMetric(filled, 'batSpeed').toFixed(1)}
            </div>
            <div className="text-[9px] text-sky-600 font-bold tracking-wider">AVG BAT SPEED</div>
          </div>
          <div className="bg-slate-950 border border-amber-600/50 rounded-lg p-2 text-center">
            <div className="text-lg font-black text-amber-300">
              {bestMetric(filled, 'batSpeed').toFixed(1)}
            </div>
            <div className="text-[9px] text-sky-600 font-bold tracking-wider">HARDEST SWING</div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-sky-700 mt-2.5">
        Leave a box blank if Blast didn&apos;t report it — blanks are skipped, not counted as zero.
      </p>
    </div>
  );
}
