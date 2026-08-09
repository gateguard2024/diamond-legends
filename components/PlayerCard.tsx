'use client';

import React, { useMemo, useState } from 'react';
import { Award, Flame, PlusCircle, Shield, Star, Target, Zap } from 'lucide-react';
import { Goal, MetricId, Phase, Player, Session } from '@/lib/types';
import GoalsPanel from './GoalsPanel';
import ProgressOverTime from './ProgressOverTime';
import PlayerIdentityEditor from './PlayerIdentityEditor';
import CoachingPanel from './CoachingPanel';
import AAAReadiness from './AAAReadiness';
import {
  BADGES,
  MILESTONES,
  computeTotals,
  currentStreak,
  daysThisWeek,
  evaluateAwards,
  levelFromXP,
  totalXP,
} from '@/lib/gamification';
import { METRICS, currentValue, previousValue } from '@/lib/goals';
import { aaaReadiness } from '@/lib/benchmarks';
import { coachFor } from '@/lib/coaching';
import { chancesFor } from '@/lib/fielding';
import { BarTrend, ProgressRing, SectionCard, StatTile } from './ui';

const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
};

const TABS: { id: Phase; label: string; icon: React.ReactNode; accent: string }[] = [
  { id: 'batting', label: 'BATTING', icon: <Zap className="w-4 h-4" />, accent: 'text-yellow-300' },
  {
    id: 'pitching',
    label: 'PITCHING',
    icon: <Target className="w-4 h-4" />,
    accent: 'text-orange-300',
  },
  { id: 'fielding', label: 'FIELDING', icon: <Shield className="w-4 h-4" />, accent: 'text-sky-300' },
];

export default function PlayerCard({
  player,
  sessions,
  goals,
  onLog,
  onSetGoal,
  onSaveIdentity,
}: {
  player: Player;
  sessions: Session[];
  goals: Goal[];
  onLog: () => void;
  onSetGoal: (metric: MetricId, target: number) => void;
  onSaveIdentity: (patch: { number: number; slogan: string }) => void;
}) {
  const [tab, setTab] = useState<Phase>('batting');

  const totals = useMemo(() => computeTotals(sessions), [sessions]);
  const xp = useMemo(() => totalXP(sessions), [sessions]);
  const level = useMemo(() => levelFromXP(xp), [xp]);
  const streak = useMemo(() => currentStreak(sessions), [sessions]);
  const week = useMemo(() => daysThisWeek(sessions), [sessions]);

  // Rolling values for every metric — feeds benchmarks and coaching.
  const current = useMemo(() => {
    const out: Partial<Record<MetricId, number | null>> = {};
    for (const def of METRICS) out[def.id] = currentValue(def, sessions);
    return out;
  }, [sessions]);

  const previous = useMemo(() => {
    const out: Partial<Record<MetricId, number | null>> = {};
    for (const def of METRICS) out[def.id] = previousValue(def, sessions);
    return out;
  }, [sessions]);

  const readiness = useMemo(() => aaaReadiness(current), [current]);

  const lastPitching = sessions.find((s) => s.pitching);
  const lastFielding = sessions.find((s) => s.fielding);
  const lastHitting = sessions.find((s) => s.hitting);

  const lastForTab =
    tab === 'batting' ? lastHitting : tab === 'pitching' ? lastPitching : lastFielding;

  const coaching = useMemo(
    () =>
      coachFor(tab, {
        lastSession: lastForTab,
        current,
        previous,
        totals,
        sessions,
      }),
    [tab, lastForTab, current, previous, totals, sessions],
  );

  // Sessions are stored newest-first; oldest-first for charts.
  const chrono = useMemo(() => [...sessions].reverse(), [sessions]);

  const strikeTrend = chrono
    .filter((s) => s.pitching && s.pitching.totalPitches > 0)
    .slice(-6)
    .map((s) => ({
      label: shortDate(s.date),
      value: Math.round((s.pitching!.strikes / s.pitching!.totalPitches) * 100),
    }));

  const batSpeedTrend = chrono
    .filter((s) => s.hitting && s.hitting.swings > 0)
    .slice(-6)
    .map((s) => ({ label: shortDate(s.date), value: s.hitting!.batSpeed }));

  const catchTrend = chrono
    .filter((s) => s.fielding && chancesFor(s.fielding) > 0)
    .slice(-6)
    .map((s) => ({
      label: shortDate(s.date),
      value: Math.round((s.fielding!.cleanReps / chancesFor(s.fielding!)) * 100),
    }));

  const badges = evaluateAwards(BADGES, totals, sessions);
  const milestones = evaluateAwards(MILESTONES, totals, sessions);
  const nextUp = [...badges, ...milestones]
    .filter((a) => !a.unlocked && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0];

  const xpPct = Math.min(100, (level.currentXP / level.xpToNextLevel) * 100);
  const lastFieldingChances = lastFielding?.fielding ? chancesFor(lastFielding.fielding) : 0;

  return (
    <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-sky-900/50 shadow-2xl">
      {/* ---------------- HEADER HUD ---------------- */}
      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-sky-950/80 rounded-2xl border border-sky-800">
        <div className="relative shrink-0">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-4 border-sky-700 bg-gradient-to-br ${player.accent.from} ${player.accent.to} flex items-center justify-center shadow-lg`}
          >
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {player.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="absolute -top-2.5 -left-2.5 bg-gradient-to-br from-orange-500 to-yellow-400 text-black font-black text-[11px] px-2 py-0.5 rounded-full shadow-md">
            #{player.number}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <PlayerIdentityEditor player={player} onSave={onSaveIdentity} />
          <p className="text-sky-300 text-xs sm:text-sm font-medium mb-2 mt-0.5">
            {level.tier} · {player.division} · Age {player.age}
          </p>
          <div className="bg-slate-900 border border-slate-700 h-6 rounded-full p-0.5 w-full relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white mix-blend-difference tracking-tight">
              {level.currentXP} / {level.xpToNextLevel} XP
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="bg-gradient-to-b from-blue-600 to-indigo-700 border-2 border-indigo-400 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-xl">
            <span className="text-2xl sm:text-3xl font-black text-white">{level.level}</span>
          </div>
          <span className="text-[10px] font-bold text-sky-400">LEVEL</span>
        </div>
      </div>

      {/* ---------------- QUICK BAR ---------------- */}
      <div className="grid grid-cols-5 gap-2 mt-4">
        <div className="bg-sky-950/60 border border-sky-900 rounded-xl p-2 text-center">
          <div className="text-lg font-black text-white flex items-center justify-center gap-1">
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-400' : 'text-slate-600'}`} />
            {streak}
          </div>
          <div className="text-[9px] text-sky-500 font-bold tracking-wider">STREAK</div>
        </div>
        <div className="bg-sky-950/60 border border-sky-900 rounded-xl p-2 text-center">
          <div className="text-lg font-black text-white">{week}/7</div>
          <div className="text-[9px] text-sky-500 font-bold tracking-wider">THIS WEEK</div>
        </div>
        <div className="bg-sky-950/60 border border-sky-900 rounded-xl p-2 text-center">
          <div className="text-lg font-black text-white">{totals.sessions}</div>
          <div className="text-[9px] text-sky-500 font-bold tracking-wider">WORKOUTS</div>
        </div>
        <div className="bg-sky-950/60 border border-sky-900 rounded-xl p-2 text-center">
          <div className="text-lg font-black text-white">{xp.toLocaleString()}</div>
          <div className="text-[9px] text-sky-500 font-bold tracking-wider">TOTAL XP</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-600/40 rounded-xl p-2 text-center">
          <div className="text-lg font-black text-amber-300">{readiness.score}%</div>
          <div className="text-[9px] text-amber-500/80 font-bold tracking-wider">TO AAA</div>
        </div>
      </div>

      <button
        onClick={onLog}
        className={`mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r ${player.accent.from} ${player.accent.to} text-slate-950 font-black tracking-wide py-3 rounded-xl hover:brightness-110 active:scale-[0.99] transition`}
      >
        <PlusCircle className="w-5 h-5" />
        LOG {player.name.toUpperCase()}&apos;S WORKOUT
      </button>

      {/* ---------------- TABS ---------------- */}
      <div className="flex gap-1.5 mt-5 border-b border-sky-900">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 text-xs font-black tracking-wider rounded-t-lg border-b-2 transition ${
              tab === t.id
                ? `border-current ${t.accent} bg-sky-950/50`
                : 'border-transparent text-slate-600 hover:text-sky-400'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 mt-4">
        {/* ---------------- COACHING ---------------- */}
        <CoachingPanel
          suggestions={coaching}
          phaseLabel={TABS.find((t) => t.id === tab)!.label}
        />

        {/* ---------------- AAA BENCHMARKS ---------------- */}
        <AAAReadiness readiness={readiness} phase={tab} />

        {/* ---------------- GOALS ---------------- */}
        <GoalsPanel
          playerId={player.id}
          sessions={sessions}
          goals={goals}
          phase={tab}
          onSetGoal={onSetGoal}
        />

        {/* ---------------- PROGRESS OVER TIME ---------------- */}
        <ProgressOverTime playerId={player.id} sessions={sessions} goals={goals} phase={tab} />

        {/* ---------------- BATTING ---------------- */}
        {tab === 'batting' && (
          <SectionCard
            title="BLAST MOTION"
            icon={<Zap className="w-4 h-4" />}
            accentText="text-yellow-300"
            right={
              <span className="text-[10px] text-sky-600 font-bold">
                {lastHitting ? `Last: ${shortDate(lastHitting.date)}` : 'No data'}
              </span>
            }
          >
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile label="BAT SPEED (MPH)" value={lastHitting?.hitting?.batSpeed ?? 0} />
              <StatTile label="PEAK HAND SPEED" value={lastHitting?.hitting?.peakHandSpeed ?? 0} />
              <StatTile
                label="ROT. ACCEL (g)"
                value={lastHitting?.hitting?.rotationalAcceleration ?? 0}
              />
              <StatTile
                label="ON PLANE EFF."
                value={lastHitting?.hitting?.onPlaneEfficiency ?? 0}
                suffix="%"
              />
              <StatTile label="ATTACK ANGLE" value={`${lastHitting?.hitting?.attackAngle ?? 0}°`} />
              <StatTile
                label="VERT BAT ANGLE"
                value={`${lastHitting?.hitting?.verticalBatAngle ?? 0}°`}
              />
              <StatTile
                label="TIME TO CONTACT"
                value={lastHitting?.hitting?.timeToContact ?? 0}
                suffix="s"
              />
              <StatTile label="POWER (kW)" value={lastHitting?.hitting?.power ?? 0} />
              <StatTile label="BLAST FACTOR" value={lastHitting?.hitting?.blastFactor ?? 0} />
              <StatTile label="SWINGS LOGGED" value={lastHitting?.hitting?.swings ?? 0} />
              <StatTile label="CAREER SWINGS" value={totals.swings.toLocaleString()} />
              <StatTile label="HARDEST SWING" value={totals.bestSwing} suffix="mph" highlight />
            </div>
            <div className="mt-2.5">
              <BarTrend
                data={batSpeedTrend}
                label="BAT SPEED (MPH) BY DATE"
                from="from-yellow-600"
                to="to-yellow-300"
                format={(n) => n.toFixed(1)}
              />
            </div>
          </SectionCard>
        )}

        {/* ---------------- PITCHING ---------------- */}
        {tab === 'pitching' && (
          <SectionCard
            title="PITCHING"
            icon={<Target className="w-4 h-4" />}
            accentText="text-orange-300"
            right={
              <span className="text-[10px] text-sky-600 font-bold">
                {lastPitching ? `Last: ${shortDate(lastPitching.date)}` : 'No data'}
              </span>
            }
          >
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile label="PITCHES" value={lastPitching?.pitching?.totalPitches ?? 0} />
              <StatTile
                label="STRIKE %"
                value={
                  lastPitching?.pitching
                    ? Math.round(
                        (lastPitching.pitching.strikes / lastPitching.pitching.totalPitches) * 100,
                      )
                    : 0
                }
                suffix="%"
              />
              <StatTile
                label="AVG SPEED"
                value={lastPitching?.pitching?.avgSpeed ?? 0}
                suffix="mph"
              />
              <StatTile
                label="TOP SPEED"
                value={lastPitching?.pitching?.topSpeed ?? 0}
                suffix="mph"
              />
              <StatTile label="CAREER PITCHES" value={totals.pitches.toLocaleString()} />
              <StatTile label="CAREER STRIKE %" value={totals.strikePct} suffix="%" />
              <StatTile label="BEST AVG VELO" value={totals.bestAvgSpeed} suffix="mph" highlight />
              <StatTile label="BEST TOP VELO" value={totals.bestTopSpeed} suffix="mph" highlight />
              <StatTile label="CAREER STRIKES" value={totals.strikes.toLocaleString()} />
            </div>
            <div className="mt-2.5">
              <BarTrend data={strikeTrend} label="STRIKE % BY DATE" format={(n) => `${n}%`} />
            </div>
          </SectionCard>
        )}

        {/* ---------------- FIELDING ---------------- */}
        {tab === 'fielding' && (
          <SectionCard
            title="FIELDING"
            icon={<Shield className="w-4 h-4" />}
            accentText="text-sky-300"
            right={
              <span className="text-[10px] text-sky-600 font-bold">
                {lastFielding ? `Last: ${shortDate(lastFielding.date)}` : 'No data'}
              </span>
            }
          >
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile label="CHANCES" value={lastFieldingChances} />
              <StatTile label="CAUGHT" value={lastFielding?.fielding?.cleanReps ?? 0} />
              <StatTile
                label="CATCH %"
                value={
                  lastFieldingChances
                    ? Math.round((lastFielding!.fielding!.cleanReps / lastFieldingChances) * 100)
                    : 0
                }
                suffix="%"
                highlight
              />
              <StatTile label="THROWS MADE" value={lastFielding?.fielding?.throwsMade ?? 0} />
              <StatTile label="ON TARGET" value={lastFielding?.fielding?.throwsAccurate ?? 0} />
              <StatTile
                label="THROW ACC."
                value={
                  lastFielding?.fielding?.throwsMade
                    ? Math.round(
                        ((lastFielding.fielding.throwsAccurate ?? 0) /
                          lastFielding.fielding.throwsMade) *
                          100,
                      )
                    : 0
                }
                suffix="%"
                highlight
              />
              <StatTile label="POP FLIES" value={lastFielding?.fielding?.popFlies ?? 0} />
              <StatTile
                label="FRONT GROUNDERS"
                value={lastFielding?.fielding?.frontGrounders ?? 0}
              />
              <StatTile label="BACKHAND" value={lastFielding?.fielding?.backhand ?? 0} />
              <StatTile label="GLOVE SIDE" value={lastFielding?.fielding?.gloveSide ?? 0} />
              <StatTile label="CAREER CHANCES" value={totals.chances.toLocaleString()} />
              <StatTile label="CAREER THROWS" value={totals.throwsMade.toLocaleString()} />
            </div>
            <div className="mt-2.5">
              <BarTrend
                data={catchTrend}
                label="CATCH % BY DATE"
                from="from-sky-600"
                to="to-cyan-300"
                format={(n) => `${n}%`}
              />
            </div>
          </SectionCard>
        )}

        {/* ---------------- ACHIEVEMENTS ---------------- */}
        <SectionCard
          title="BADGES & MILESTONES"
          icon={<Award className="w-4 h-4" />}
          accentText="text-white"
          right={
            nextUp ? (
              <span className="text-[10px] text-sky-600 font-bold">
                Next up: {nextUp.def.label} · {Math.round(nextUp.progress * 100)}%
              </span>
            ) : (
              <span className="text-[10px] text-sky-600 font-bold">Auto-tracked</span>
            )
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {badges.map(({ def, unlocked, progress }) => (
              <div
                key={def.id}
                title={def.description}
                className={`px-2.5 py-2 rounded-xl border ${
                  unlocked
                    ? 'bg-gradient-to-br from-orange-950 to-orange-900 border-orange-600/60'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-base ${unlocked ? '' : 'grayscale opacity-40'}`}>
                    {def.icon}
                  </span>
                  <span
                    className={`text-[9px] font-black tracking-wider leading-tight ${
                      unlocked ? 'text-orange-200' : 'text-slate-500'
                    }`}
                  >
                    {def.label}
                  </span>
                </div>
                {!unlocked && <ProgressRing progress={progress} />}
              </div>
            ))}
          </div>

          <h4 className="text-[10px] text-sky-600 font-bold tracking-wider mb-2">
            MILESTONES — CAREER VOLUME
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {milestones.map(({ def, unlocked, progress }) => (
              <div
                key={def.id}
                title={def.description}
                className={`border-2 p-2 rounded-lg text-center ${
                  unlocked ? 'bg-sky-950 border-sky-600' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <Star
                  className={`w-4 h-4 mx-auto mb-1 ${
                    unlocked ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'
                  }`}
                />
                <span
                  className={`text-[9px] font-bold leading-tight block ${
                    unlocked ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  {def.label}
                </span>
                {!unlocked && <ProgressRing progress={progress} />}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
