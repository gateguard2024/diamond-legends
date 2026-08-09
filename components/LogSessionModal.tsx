'use client';

import React, { useState } from 'react';
import { Loader2, Shield, Target, X, Zap } from 'lucide-react';
import { FieldingRep, Pitch, Player, Session, Swing } from '@/lib/types';
import { displayName } from '@/lib/players';
import { hittingFromSwings, isSwingFilled } from '@/lib/swings';
import { pitchingFromLog } from '@/lib/pitches';
import { fieldingFromReps, isRepFilled } from '@/lib/fielding';
import SwingLogger from './SwingLogger';
import PitchLogger from './PitchLogger';
import FieldingLogger from './FieldingLogger';

type Draft = Omit<Session, 'id' | 'xpEarned'>;
type Tab = 'batting' | 'pitching' | 'fielding';

const TABS: { id: Tab; label: string; icon: React.ReactNode; accent: string }[] = [
  { id: 'batting', label: 'BATTING', icon: <Zap className="w-4 h-4" />, accent: 'text-yellow-300' },
  {
    id: 'pitching',
    label: 'PITCHING',
    icon: <Target className="w-4 h-4" />,
    accent: 'text-orange-300',
  },
  { id: 'fielding', label: 'FIELDING', icon: <Shield className="w-4 h-4" />, accent: 'text-sky-300' },
];

export default function LogSessionModal({
  player,
  saving = false,
  onClose,
  onSave,
}: {
  player: Player;
  saving?: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => void;
}) {
  const [tab, setTab] = useState<Tab>('batting');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const [swings, setSwings] = useState<Swing[]>([]);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [reps, setReps] = useState<FieldingRep[]>([]);

  const filledSwings = swings.filter(isSwingFilled).length;
  const filledReps = reps.filter(isRepFilled).length;
  const counts: Record<Tab, number> = {
    batting: filledSwings,
    pitching: pitches.length,
    fielding: filledReps,
  };

  const nothingLogged = filledSwings === 0 && pitches.length === 0 && filledReps === 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nothingLogged) return;

    const draft: Draft = { playerId: player.id, date, notes: notes.trim() || undefined };
    if (filledSwings > 0) draft.hitting = hittingFromSwings(swings);
    if (pitches.length > 0) draft.pitching = pitchingFromLog(pitches);
    if (filledReps > 0) draft.fielding = fieldingFromReps(reps);

    onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 overflow-y-auto">
      <form
        onSubmit={submit}
        className="bg-slate-900 border border-sky-800 rounded-3xl w-full max-w-4xl my-4 animate-slideUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sky-900 sticky top-0 bg-slate-900 rounded-t-3xl z-30">
          <div>
            <h2 className="text-xl font-black text-white">LOG WORKOUT</h2>
            <p className="text-xs text-sky-400 font-medium">{displayName(player)}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="hidden sm:block">
              <span className="text-[9px] font-bold text-sky-600 tracking-wider block">DATE</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-950 border border-sky-800 rounded-lg px-2 py-1.5 text-white font-bold text-sm focus:outline-none focus:border-sky-400"
              />
            </label>
            <button type="button" onClick={onClose} className="text-sky-500 hover:text-white p-1">
              <X />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Date on mobile */}
          <label className="block sm:hidden">
            <span className="text-[10px] font-bold text-sky-500 tracking-wider block mb-1">
              SESSION DATE
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-sky-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-400"
            />
          </label>

          {/* Tabs */}
          <div className="flex gap-1.5 border-b border-sky-900">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-black tracking-wider rounded-t-lg border-b-2 transition ${
                  tab === t.id
                    ? `border-current ${t.accent} bg-sky-950/50`
                    : 'border-transparent text-slate-600 hover:text-sky-400'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                {counts[t.id] > 0 && (
                  <span className="bg-sky-800 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {counts[t.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panels */}
          {tab === 'batting' && (
            <SwingLogger
              swings={swings}
              onChange={setSwings}
              showAll={showAllColumns}
              onToggleColumns={() => setShowAllColumns((v) => !v)}
            />
          )}
          {tab === 'pitching' && <PitchLogger pitches={pitches} onChange={setPitches} />}
          {tab === 'fielding' && <FieldingLogger reps={reps} onChange={setReps} />}

          {/* Notes */}
          <label className="block">
            <span className="text-[10px] font-bold text-sky-500 tracking-wider block mb-1">
              COACH NOTES (OPTIONAL)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Worked on staying through the ball..."
              className="w-full bg-slate-950 border border-sky-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-400"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-sky-900 sticky bottom-0 bg-slate-900 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-3 rounded-xl border border-sky-800 text-sky-300 font-bold hover:bg-sky-950 disabled:opacity-50"
          >
            Cancel
          </button>
          <span className="text-[10px] font-bold text-sky-600 hidden sm:block">
            {filledSwings} swings · {pitches.length} pitches · {filledReps} drill lines
          </span>
          <button
            type="submit"
            disabled={saving || nothingLogged}
            title={nothingLogged ? 'Log at least one swing, pitch, or drill line' : undefined}
            className="ml-auto flex-1 sm:flex-none sm:min-w-[15rem] flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-300 text-slate-950 font-black tracking-wide py-3 px-6 rounded-xl hover:brightness-110 disabled:opacity-40"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'SAVING…' : 'SAVE & EARN XP'}
          </button>
        </div>
      </form>
    </div>
  );
}
