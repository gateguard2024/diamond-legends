'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Cloud, Download, HardDrive, Loader2, Trophy, Upload } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import LogSessionModal from '@/components/LogSessionModal';
import SessionHistory from '@/components/SessionHistory';
import CelebrationModal from '@/components/CelebrationModal';
import { PLAYERS, PLAYER_ORDER } from '@/lib/players';
import { useAppData, SaveResult } from '@/lib/useAppData';
import { levelFromXP, totalXP } from '@/lib/gamification';
import { isSupabaseConfigured } from '@/lib/supabase';
import { MetricId, PlayerId, Session } from '@/lib/types';

export default function DiamondLegendsDashboard() {
  const {
    sessions,
    loading,
    error,
    forPlayer,
    goalsFor,
    addSession,
    deleteSession,
    importSessions,
    setGoal,
  } = useAppData();

  const [logging, setLogging] = useState<PlayerId | null>(null);
  const [celebrating, setCelebrating] = useState<{ playerId: PlayerId; result: SaveResult } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const leader = useMemo(() => {
    const scored = PLAYER_ORDER.map((id) => ({ id, xp: totalXP(forPlayer(id)) }));
    scored.sort((a, b) => b.xp - a.xp);
    if (scored[0].xp === 0) return null;
    if (scored[0].xp === scored[1]?.xp) return { id: null as PlayerId | null, xp: scored[0].xp };
    return scored[0];
  }, [forPlayer]);

  const handleSave = async (draft: Omit<Session, 'id' | 'xpEarned'>) => {
    setSaving(true);
    try {
      const result = await addSession(draft);
      setLogging(null);
      setCelebrating({ playerId: draft.playerId, result });
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not save that session.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetGoal = async (playerId: PlayerId, metric: MetricId, target: number) => {
    try {
      await setGoal(playerId, metric, target);
      flash(`${PLAYERS[playerId].name}'s new goal is locked in.`);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Could not save that goal.');
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diamond-legends-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) return flash('That file is not a Diamond Legends backup.');
        await importSessions(parsed as Session[]);
        flash(`Imported ${parsed.length} sessions.`);
      } catch {
        flash('Could not read that file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-sky-200 p-4 sm:p-8 font-sans">
      {/* HEADER */}
      <header className="pb-5 border-b border-sky-900/50 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex flex-wrap items-center gap-3">
            DIAMOND LEGENDS
            <span className="text-xs sm:text-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full font-semibold">
              9U / 10U
            </span>
          </h1>
          <p className="text-sky-300 text-sm mt-1 flex items-center gap-2">
            Carl &amp; Austin · Workout Leaderboard
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600"
              title={
                isSupabaseConfigured
                  ? 'Synced to Supabase — same data on every device'
                  : 'Saved in this browser only — add Supabase env vars to sync'
              }
            >
              {isSupabaseConfigured ? (
                <>
                  <Cloud className="w-3 h-3" /> SYNCED
                </>
              ) : (
                <>
                  <HardDrive className="w-3 h-3" /> LOCAL ONLY
                </>
              )}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {leader && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-xl text-xs font-bold">
              <Trophy className="w-4 h-4" />
              {leader.id ? `${PLAYERS[leader.id].name} leads` : 'Dead heat'} ·{' '}
              {leader.xp.toLocaleString()} XP
            </div>
          )}
          <button
            onClick={exportJSON}
            title="Download a backup of all sessions"
            className="flex items-center gap-1.5 border border-sky-800 text-sky-300 hover:bg-sky-950 px-3 py-2 rounded-xl text-xs font-bold"
          >
            <Download className="w-4 h-4" /> Backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            title="Restore sessions from a backup file"
            className="flex items-center gap-1.5 border border-sky-800 text-sky-300 hover:bg-sky-950 px-3 py-2 rounded-xl text-xs font-bold"
          >
            <Upload className="w-4 h-4" /> Restore
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importJSON(file);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      {error && (
        <div className="mb-6 flex items-start gap-3 bg-rose-950/50 border border-rose-800 text-rose-200 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Could not reach the database</p>
            <p className="text-xs text-rose-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-sky-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-bold text-sm">Loading player cards…</span>
        </div>
      ) : (
        <>
          <main className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {PLAYER_ORDER.map((id) => (
              <PlayerCard
                key={id}
                player={PLAYERS[id]}
                sessions={forPlayer(id)}
                goals={goalsFor(id)}
                onLog={() => setLogging(id)}
                onSetGoal={(metric, target) => handleSetGoal(id, metric, target)}
              />
            ))}
          </main>

          {sessions.length > 0 && (
            <section className="mt-8 bg-slate-900 border border-sky-900/50 rounded-3xl p-4 sm:p-6">
              <h3 className="text-base font-bold text-white mb-4">HEAD TO HEAD</h3>
              <div className="space-y-3">
                {PLAYER_ORDER.map((id) => {
                  const xp = totalXP(forPlayer(id));
                  const max = Math.max(1, ...PLAYER_ORDER.map((p) => totalXP(forPlayer(p))));
                  const lvl = levelFromXP(xp);
                  return (
                    <div key={id} className="flex items-center gap-3">
                      <span className="w-16 text-xs font-black text-white">{PLAYERS[id].name}</span>
                      <div className="flex-1 h-7 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${PLAYERS[id].accent.from} ${PLAYERS[id].accent.to} transition-all duration-700`}
                          style={{ width: `${(xp / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-32 text-right text-xs font-bold text-sky-300">
                        Lv {lvl.level} · {xp.toLocaleString()} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <SessionHistory
            sessions={sessions}
            onDelete={(id) => {
              deleteSession(id).catch(() => flash('Could not delete that session.'));
            }}
          />
        </>
      )}

      <p className="text-center text-[11px] text-sky-800 mt-8">
        Hitting metrics from Blast Motion · Current Avg is a rolling 5-session average
      </p>

      {/* MODALS */}
      {logging && (
        <LogSessionModal
          player={PLAYERS[logging]}
          saving={saving}
          onClose={() => setLogging(null)}
          onSave={handleSave}
        />
      )}

      {celebrating && (
        <CelebrationModal
          player={PLAYERS[celebrating.playerId]}
          result={celebrating.result}
          onSetNextGoal={(metric, target) => handleSetGoal(celebrating.playerId, metric, target)}
          onClose={() => setCelebrating(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] bg-gradient-to-r from-orange-500 to-amber-300 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-2xl animate-popIn">
          {toast}
        </div>
      )}
    </div>
  );
}
