'use client';

import React, { useState } from 'react';
import { Check, Crosshair, Pencil, Target, TrendingDown, TrendingUp, Trophy, X } from 'lucide-react';
import { Goal, MetricId, PlayerId, Session } from '@/lib/types';
import {
  GOAL_GAIN_PCT,
  METRIC_BY_ID,
  METRICS,
  MetricDef,
  ROLLING_WINDOW,
  achievedGoals,
  activeGoal,
  formatMetric,
  goalProgress,
  initialTarget,
} from '@/lib/goals';

const GAIN_LABEL = `+${Math.round(GOAL_GAIN_PCT * 100)}%`;

function DeltaChip({ def, current, previous }: { def: MetricDef; current: number; previous: number }) {
  const diff = current - previous;
  if (Math.abs(diff) < 10 ** -def.decimals / 2) {
    return <span className="text-[10px] font-bold text-slate-500">no change</span>;
  }
  const up = diff > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-black ${
        up ? 'text-emerald-400' : 'text-rose-400'
      }`}
    >
      <Icon className="w-3 h-3" />
      {up ? '+' : ''}
      {diff.toFixed(def.decimals)}
    </span>
  );
}

function GoalRow({
  def,
  goal,
  sessions,
  onSetGoal,
}: {
  def: MetricDef;
  goal: Goal | null;
  sessions: Session[];
  onSetGoal: (metric: MetricId, target: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const gp = goalProgress(def, goal, sessions);
  const suggested = initialTarget(def, sessions);

  const startEdit = () => {
    setDraft(String(goal ? goal.target : suggested));
    setEditing(true);
  };

  const commit = () => {
    const value = Number(draft);
    if (!Number.isNaN(value) && value > 0) onSetGoal(def.id, value);
    setEditing(false);
  };

  return (
    <div
      className={`rounded-xl border p-3 ${
        gp.achieved ? 'border-emerald-600/60 bg-emerald-950/30' : 'border-sky-900 bg-sky-950/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className={`text-[10px] font-black tracking-wider ${def.text}`}>{def.short}</div>
          <div className="text-[9px] text-sky-700 font-bold">{def.phase}</div>
        </div>
        {gp.best !== null && (
          <div
            className="text-right shrink-0"
            title="Best single session ever — pulled automatically from the log"
          >
            <div className="text-[9px] text-sky-700 font-bold tracking-wider">BEST EVER</div>
            <div className="text-[11px] font-black text-sky-300">
              {gp.best.toFixed(def.decimals)}
              {def.unit}
            </div>
          </div>
        )}
      </div>

      {/* Current avg → goal */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white leading-none">
              {formatMetric(def, gp.current)}
            </span>
            <span className="text-xs font-bold text-sky-500">{def.unit}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-sky-600 font-bold tracking-wider">
              CURRENT AVG{gp.samples ? ` · ${gp.samples} of ${ROLLING_WINDOW}` : ''}
            </span>
            {gp.current !== null && gp.previous !== null && (
              <DeltaChip def={def} current={gp.current} previous={gp.previous} />
            )}
          </div>
        </div>

        <div className="text-right">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="number"
                step={def.decimals ? '0.1' : '1'}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setEditing(false);
                }}
                className="w-16 bg-slate-950 border border-amber-500 rounded-md px-1.5 py-1 text-white font-black text-sm text-right focus:outline-none"
              />
              <button onClick={commit} className="text-emerald-400 p-0.5" aria-label="Save goal">
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-slate-500 p-0.5"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : goal ? (
            <button
              onClick={startEdit}
              className="group text-right"
              title={`Goal set at ${GAIN_LABEL} over the average when it was created. Tap to change.`}
            >
              <div className="flex items-center justify-end gap-1">
                <Target className="w-3 h-3 text-amber-400" />
                <span className="text-lg font-black text-amber-300 leading-none">
                  {goal.target.toFixed(def.decimals)}
                </span>
                <Pencil className="w-3 h-3 text-slate-600 group-hover:text-amber-300" />
              </div>
              <div className="text-[9px] text-sky-600 font-bold tracking-wider mt-0.5">
                GOAL · {GAIN_LABEL}
              </div>
            </button>
          ) : (
            <button
              onClick={startEdit}
              title={`${GAIN_LABEL} over the current average`}
              className="flex items-center gap-1 text-[10px] font-black bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-1.5 rounded-lg hover:bg-amber-500/25"
            >
              <Crosshair className="w-3 h-3" />
              SET {suggested.toFixed(def.decimals)} · {GAIN_LABEL}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {goal && (
        <>
          <div className="h-2 bg-slate-900 rounded-full overflow-hidden mt-2.5 border border-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${def.from} ${def.to} transition-all duration-700`}
              style={{ width: `${Math.round(gp.progress * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-sky-700 font-bold">
              start {goal.startValue.toFixed(def.decimals)}
            </span>
            <span
              className={`text-[9px] font-black ${
                gp.achieved ? 'text-emerald-400' : 'text-sky-500'
              }`}
            >
              {gp.achieved
                ? 'GOAL HIT! 🎉'
                : gp.remaining !== null
                  ? `${gp.remaining.toFixed(def.decimals)}${def.unit} to go`
                  : 'log a session'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function GoalsPanel({
  playerId,
  sessions,
  goals,
  onSetGoal,
}: {
  playerId: PlayerId;
  sessions: Session[];
  goals: Goal[];
  onSetGoal: (metric: MetricId, target: number) => void;
}) {
  const cleared = achievedGoals(goals, playerId);

  return (
    <div className="p-4 sm:p-5 bg-sky-950/40 rounded-2xl border border-sky-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-2">
          <Target className="w-4 h-4" /> CURRENT AVG → GOAL
        </h3>
        <span className="text-[10px] text-sky-600 font-bold text-right">
          Rolling last {ROLLING_WINDOW} sessions · goals auto-set at {GAIN_LABEL}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {METRICS.map((def) => (
          <GoalRow
            key={def.id}
            def={def}
            goal={activeGoal(goals, playerId, def.id)}
            sessions={sessions}
            onSetGoal={onSetGoal}
          />
        ))}
      </div>

      {cleared.length > 0 && (
        <div className="mt-4">
          <h4 className="text-[10px] text-sky-600 font-bold tracking-wider mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> GOALS ACHIEVED ({cleared.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {cleared.slice(0, 12).map((g) => {
              const def = METRIC_BY_ID[g.metric];
              if (!def) return null;
              return (
                <span
                  key={g.id}
                  title={`Achieved ${g.achievedAt?.slice(0, 10)}`}
                  className="text-[10px] font-black bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 px-2 py-1 rounded-full"
                >
                  {def.short} {g.target.toFixed(def.decimals)}
                  {def.unit} ✓
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
