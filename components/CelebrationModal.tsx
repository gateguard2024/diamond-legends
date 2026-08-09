'use client';

import React, { useState } from 'react';
import { Flame, PartyPopper, Sparkles, Target, Trophy } from 'lucide-react';
import { MetricId, PersonalBest, Player } from '@/lib/types';
import { displayName } from '@/lib/players';
import { METRIC_BY_ID } from '@/lib/goals';
import type { SaveResult } from '@/lib/useAppData';

export default function CelebrationModal({
  player,
  result,
  onSetNextGoal,
  onClose,
}: {
  player: Player;
  result: SaveResult;
  onSetNextGoal: (metric: MetricId, target: number) => void;
  onClose: () => void;
}) {
  const [targets, setTargets] = useState<Record<string, string>>(() =>
    Object.fromEntries(result.clearedGoals.map((c) => [c.goal.metric, String(c.suggested)])),
  );
  const [locked, setLocked] = useState<Record<string, boolean>>({});

  const accept = (metric: MetricId) => {
    const value = Number(targets[metric]);
    if (!Number.isNaN(value) && value > 0) {
      onSetNextGoal(metric, value);
      setLocked((prev) => ({ ...prev, [metric]: true }));
    }
  };

  const hasGoals = result.clearedGoals.length > 0;
  const hasPBs = result.personalBests.length > 0;

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-lg my-6 animate-popIn shadow-[0_0_60px_-15px] shadow-amber-500/40">
        {/* Banner */}
        <div className="text-center pt-7 px-6">
          <div className="text-5xl mb-2">{hasGoals ? '🏆' : hasPBs ? '🔥' : '⚾'}</div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {hasGoals ? 'GOAL ACHIEVED!' : hasPBs ? 'NEW PERSONAL BEST!' : 'WORKOUT LOGGED'}
          </h2>
          <p className="text-sky-300 text-sm font-medium mt-1">{displayName(player)}</p>

          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-300 text-slate-950 font-black px-4 py-2 rounded-full mt-4">
            <Sparkles className="w-4 h-4" />+{result.session.xpEarned} XP
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Personal bests */}
          {hasPBs && (
            <div>
              <h3 className="text-[10px] font-black text-sky-600 tracking-wider mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" /> NEW BESTS THIS SESSION
              </h3>
              <div className="space-y-1.5">
                {result.personalBests.map((pb: PersonalBest) => (
                  <div
                    key={pb.metric}
                    className="flex items-center justify-between bg-orange-950/40 border border-orange-700/50 rounded-xl px-3 py-2"
                  >
                    <span className="text-xs font-black text-orange-200 tracking-wide">
                      {pb.label}
                    </span>
                    <span className="text-xs font-bold text-sky-400">
                      <span className="line-through text-slate-600 mr-2">
                        {pb.previous.toFixed(1)}
                      </span>
                      <span className="text-white text-base font-black">
                        {pb.value.toFixed(1)}
                        {pb.unit}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cleared goals + next target */}
          {hasGoals && (
            <div>
              <h3 className="text-[10px] font-black text-sky-600 tracking-wider mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> GOALS CLEARED — SET THE NEXT ONE
              </h3>
              <div className="space-y-2.5">
                {result.clearedGoals.map(({ goal, value, suggested }) => {
                  const def = METRIC_BY_ID[goal.metric];
                  const done = locked[goal.metric];
                  return (
                    <div
                      key={goal.id}
                      className="bg-emerald-950/30 border border-emerald-700/50 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span className={`text-xs font-black tracking-wider ${def.text}`}>
                          {def.short}
                        </span>
                        <span className="text-xs font-bold text-emerald-300">
                          hit {value.toFixed(def.decimals)}
                          {def.unit} · goal was {goal.target.toFixed(def.decimals)}
                        </span>
                      </div>

                      {done ? (
                        <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                          <Target className="w-4 h-4" />
                          Next goal set: {targets[goal.metric]}
                          {def.unit}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-sky-500 tracking-wider">
                            NEXT GOAL
                          </span>
                          <input
                            type="number"
                            step={def.decimals ? '0.1' : '1'}
                            value={targets[goal.metric] ?? String(suggested)}
                            onChange={(e) =>
                              setTargets((prev) => ({ ...prev, [goal.metric]: e.target.value }))
                            }
                            className="w-20 bg-slate-950 border border-amber-500/60 rounded-lg px-2 py-1.5 text-white font-black text-sm text-center focus:outline-none focus:border-amber-400"
                          />
                          <span className="text-[10px] text-sky-600 font-bold">{def.unit}</span>
                          <button
                            onClick={() => accept(goal.metric)}
                            className="ml-auto bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg hover:brightness-110"
                          >
                            LOCK IT IN
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!hasGoals && !hasPBs && (
            <p className="text-center text-sm text-sky-400">
              Reps in the bank. Keep stacking them — the averages move with every session.
            </p>
          )}
        </div>

        <div className="p-5 border-t border-sky-900">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-sky-900 hover:bg-sky-800 text-white font-black py-3 rounded-xl"
          >
            <PartyPopper className="w-4 h-4" />
            {hasGoals && Object.keys(locked).length < result.clearedGoals.length
              ? 'SKIP FOR NOW'
              : "LET'S GO"}
          </button>
        </div>
      </div>
    </div>
  );
}
