'use client';

import React from 'react';
import { Clock3, Trash2 } from 'lucide-react';
import { PLAYERS } from '@/lib/players';
import { Session } from '@/lib/types';
import { fieldingRepTotal } from '@/lib/gamification';

export default function SessionHistory({
  sessions,
  onDelete,
}: {
  sessions: Session[];
  onDelete: (id: string) => void;
}) {
  return (
    <section className="mt-8 bg-slate-900 border border-sky-900/50 rounded-3xl p-4 sm:p-6">
      <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
        <Clock3 className="w-5 h-5 text-sky-400" /> SESSION LOG
      </h3>

      {sessions.length === 0 ? (
        <p className="text-sm text-sky-700 py-6 text-center">
          Nothing logged yet. Hit &ldquo;Log Workout&rdquo; on a player card to start earning XP.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-sky-600 font-bold tracking-wider text-left border-b border-sky-900">
                <th className="py-2 pr-3">DATE</th>
                <th className="py-2 pr-3">PLAYER</th>
                <th className="py-2 pr-3">PITCHING</th>
                <th className="py-2 pr-3">FIELDING</th>
                <th className="py-2 pr-3">HITTING (BLAST)</th>
                <th className="py-2 pr-3">XP</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-sky-950 hover:bg-sky-950/40">
                  <td className="py-2.5 pr-3 text-sky-300 whitespace-nowrap font-medium">{s.date}</td>
                  <td className="py-2.5 pr-3 font-bold text-white whitespace-nowrap">
                    {PLAYERS[s.playerId].name}
                  </td>
                  <td className="py-2.5 pr-3 text-sky-400 whitespace-nowrap">
                    {s.pitching
                      ? `${s.pitching.strikes}/${s.pitching.totalPitches} K · ${s.pitching.avgSpeed ?? 0} avg · ${s.pitching.topSpeed} top`
                      : '—'}
                  </td>
                  <td className="py-2.5 pr-3 text-sky-400 whitespace-nowrap">
                    {s.fielding ? `${fieldingRepTotal(s)} reps · ${s.fielding.cleanReps} clean` : '—'}
                  </td>
                  <td className="py-2.5 pr-3 text-sky-400 whitespace-nowrap">
                    {s.hitting
                      ? `${s.hitting.swings} sw · ${s.hitting.batSpeed} mph · ${s.hitting.onPlaneEfficiency}% plane`
                      : '—'}
                  </td>
                  <td className="py-2.5 pr-3 font-black text-amber-300 whitespace-nowrap">
                    +{s.xpEarned}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => onDelete(s.id)}
                      aria-label="Delete session"
                      className="text-slate-600 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
