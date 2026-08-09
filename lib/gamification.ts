import { AwardDef, CareerTotals, LevelInfo, PersonalBest, Session, Tier } from './types';
import { chancesFor } from './fielding';

// ---------------------------------------------------------------------------
// XP ENGINE
// ---------------------------------------------------------------------------

/**
 * XP for a single logged session. Rewards volume first (a 9-year-old should
 * get credit just for showing up and doing reps) and quality second.
 */
export function xpForSession(session: Session, priorBests: Partial<CareerTotals> = {}): number {
  let xp = 20; // showing up
  let phases = 0;

  if (session.pitching && session.pitching.totalPitches > 0) {
    phases++;
    const p = session.pitching;
    xp += p.totalPitches * 1;
    xp += p.strikes * 2;
    const pct = p.totalPitches ? (p.strikes / p.totalPitches) * 100 : 0;
    if (p.totalPitches >= 20 && pct >= 60) xp += 25; // command bonus
    if (p.topSpeed > (priorBests.bestTopSpeed ?? 0)) xp += 50; // top velo PR
    if (p.avgSpeed > (priorBests.bestAvgSpeed ?? 0)) xp += 50; // average velo PR
  }

  if (session.fielding) {
    phases++;
    const f = session.fielding;
    const chances = chancesFor(f);
    xp += chances * 2; // every ball he took
    xp += Math.min(f.cleanReps, chances) * 1; // clean-glove bonus
    xp += (f.throwsAccurate ?? 0) * 2; // on-target throws

    const catchPct = chances ? (f.cleanReps / chances) * 100 : 0;
    const throwPct = f.throwsMade ? ((f.throwsAccurate ?? 0) / f.throwsMade) * 100 : 0;

    if (chances >= 50) xp += 25; // grind bonus
    if (chances >= 20 && catchPct >= 90) xp += 25; // soft hands bonus
    if ((f.throwsMade ?? 0) >= 20 && throwPct >= 85) xp += 25; // cannon bonus
  }

  if (session.hitting && session.hitting.swings > 0) {
    phases++;
    const h = session.hitting;
    xp += h.swings * 1;
    if (h.onPlaneEfficiency >= 70) xp += 25; // Blast plane bonus
    if (h.batSpeed > (priorBests.bestBatSpeed ?? 0)) xp += 50; // bat speed PR
  }

  if (phases === 3) xp += 50; // full workout bonus

  return Math.round(xp);
}

export function fieldingRepTotal(session: Session): number {
  const f = session.fielding;
  if (!f) return 0;
  return (
    f.popFlies + f.frontGrounders + f.backhand + f.gloveSide + f.gloveSideTurns + f.backhandTurns
  );
}

/** XP required to clear a given level. Gets gently steeper. */
export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 40;
}

export function levelFromXP(totalXP: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, totalXP);
  while (remaining >= xpForLevel(level) && level < 999) {
    remaining -= xpForLevel(level);
    level++;
  }
  return {
    level,
    tier: tierForLevel(level),
    totalXP,
    currentXP: remaining,
    xpToNextLevel: xpForLevel(level),
  };
}

export function tierForLevel(level: number): Tier {
  if (level >= 40) return 'Hall of Famer';
  if (level >= 25) return 'All-Star';
  if (level >= 10) return 'Pro';
  return 'Rookie';
}

// ---------------------------------------------------------------------------
// CAREER AGGREGATION
// ---------------------------------------------------------------------------

export function emptyTotals(): CareerTotals {
  return {
    sessions: 0,
    pitches: 0,
    strikes: 0,
    strikePct: 0,
    bestAvgSpeed: 0,
    bestTopSpeed: 0,
    fieldingReps: 0,
    cleanReps: 0,
    cleanPct: 0,
    chances: 0,
    catchPct: 0,
    throwsMade: 0,
    throwsAccurate: 0,
    throwAccuracy: 0,
    swings: 0,
    bestBatSpeed: 0,
    bestSwing: 0,
    bestOnPlane: 0,
    bestBlastFactor: 0,
    bestHandSpeed: 0,
  };
}

export function computeTotals(sessions: Session[]): CareerTotals {
  const t = emptyTotals();
  t.sessions = sessions.length;

  for (const s of sessions) {
    if (s.pitching) {
      t.pitches += s.pitching.totalPitches;
      t.strikes += s.pitching.strikes;
      t.bestAvgSpeed = Math.max(t.bestAvgSpeed, s.pitching.avgSpeed ?? 0);
      t.bestTopSpeed = Math.max(t.bestTopSpeed, s.pitching.topSpeed);
    }
    if (s.fielding) {
      t.fieldingReps += fieldingRepTotal(s);
      t.cleanReps += s.fielding.cleanReps;
      t.chances += chancesFor(s.fielding);
      t.throwsMade += s.fielding.throwsMade ?? 0;
      t.throwsAccurate += s.fielding.throwsAccurate ?? 0;
    }
    if (s.hitting) {
      t.swings += s.hitting.swings;
      t.bestBatSpeed = Math.max(t.bestBatSpeed, s.hitting.batSpeed);
      t.bestSwing = Math.max(t.bestSwing, s.hitting.bestSwingBatSpeed ?? s.hitting.batSpeed);
      t.bestOnPlane = Math.max(t.bestOnPlane, s.hitting.onPlaneEfficiency);
      t.bestBlastFactor = Math.max(t.bestBlastFactor, s.hitting.blastFactor);
      t.bestHandSpeed = Math.max(t.bestHandSpeed, s.hitting.peakHandSpeed);
    }
  }

  t.strikePct = t.pitches ? Math.round((t.strikes / t.pitches) * 100) : 0;
  t.cleanPct = t.fieldingReps ? Math.round((t.cleanReps / t.fieldingReps) * 100) : 0;
  t.catchPct = t.chances ? Math.round((t.cleanReps / t.chances) * 100) : 0;
  t.throwAccuracy = t.throwsMade ? Math.round((t.throwsAccurate / t.throwsMade) * 100) : 0;
  return t;
}

export function totalXP(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
}

/** Bests from every session EXCEPT the one being scored — used for PR bonuses. */
export function bestsBefore(sessions: Session[], excludeId?: string): CareerTotals {
  return computeTotals(sessions.filter((s) => s.id !== excludeId));
}

// ---------------------------------------------------------------------------
// STREAKS
// ---------------------------------------------------------------------------

/** Consecutive calendar days (ending today or yesterday) with a logged session. */
export function currentStreak(sessions: Session[], today = new Date()): number {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map((s) => s.date));
  const cursor = new Date(today);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  // Allow the streak to still be "alive" if they haven't worked out yet today.
  if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(iso(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Distinct days trained in the last 7 calendar days. */
export function daysThisWeek(sessions: Session[], today = new Date()): number {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  return new Set(sessions.filter((s) => s.date >= cutoffIso).map((s) => s.date)).size;
}

// ---------------------------------------------------------------------------
// BADGES (skill achievements) & MILESTONES (volume achievements)
// ---------------------------------------------------------------------------

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const BADGES: AwardDef[] = [
  {
    id: 'STRIKE_SNIPER',
    label: 'STRIKE ZONE SNIPER',
    icon: '🎯',
    description: 'Hit 65% strikes in a session of 25+ pitches',
    progress: (_t, sessions) =>
      clamp01(
        Math.max(
          0,
          ...sessions.map((s) =>
            s.pitching && s.pitching.totalPitches >= 25
              ? s.pitching.strikes / s.pitching.totalPitches / 0.65
              : 0,
          ),
        ),
      ),
  },
  {
    id: 'BAT_SPEED_DEMON',
    label: 'BAT SPEED DEMON',
    icon: '⚡',
    description: 'Average 50 mph bat speed in a session',
    progress: (t) => clamp01(t.bestBatSpeed / 50),
  },
  {
    id: 'ON_PLANE',
    label: 'ON-PLANE MACHINE',
    icon: '📐',
    description: '75% On Plane Efficiency (Blast)',
    progress: (t) => clamp01(t.bestOnPlane / 75),
  },
  {
    id: 'VACUUM',
    label: 'THE VACUUM',
    icon: '🧤',
    description: '90% clean fielding reps across 200+ reps',
    progress: (t) => clamp01(Math.min(t.cleanPct / 90, t.fieldingReps / 200)),
  },
  {
    id: 'FLAMETHROWER',
    label: 'FLAMETHROWER',
    icon: '🔥',
    description: 'Touch 50 mph on the gun',
    progress: (t) => clamp01(t.bestTopSpeed / 50),
  },
  {
    id: 'HEATER',
    label: 'PURE HEAT',
    icon: '🚀',
    description: 'Average 45 mph across a full session',
    progress: (t) => clamp01(t.bestAvgSpeed / 45),
  },
  {
    id: 'GOLD_GLOVE',
    label: 'GOLD GLOVE',
    icon: '🥇',
    description: '92% catch rate across 150+ chances',
    progress: (t) => clamp01(Math.min(t.catchPct / 92, t.chances / 150)),
  },
  {
    id: 'CANNON',
    label: 'THE CANNON',
    icon: '💪',
    description: '90% throwing accuracy across 100+ throws',
    progress: (t) => clamp01(Math.min(t.throwAccuracy / 90, t.throwsMade / 100)),
  },
  {
    id: 'IRON_WORKER',
    label: 'IRON WORKER',
    icon: '🏗️',
    description: 'Log 25 workouts',
    progress: (t) => clamp01(t.sessions / 25),
  },
];

export const MILESTONES: AwardDef[] = [
  {
    id: 'FIRST_REP',
    label: 'First Workout',
    icon: '🌱',
    description: 'Log your very first session',
    progress: (t) => clamp01(t.sessions / 1),
  },
  {
    id: '250_PITCHES',
    label: '250 Pitches',
    icon: '⚾',
    description: 'Throw 250 career pitches',
    progress: (t) => clamp01(t.pitches / 250),
  },
  {
    id: '250_STRIKES',
    label: '250 Strikes',
    icon: '🎯',
    description: 'Throw 250 career strikes',
    progress: (t) => clamp01(t.strikes / 250),
  },
  {
    id: '500_REPS',
    label: '500 Rep Club',
    icon: '🧤',
    description: '500 career fielding reps',
    progress: (t) => clamp01(t.fieldingReps / 500),
  },
  {
    id: '1000_SWINGS',
    label: '1,000 Swings',
    icon: '🏏',
    description: '1,000 career Blast-tracked swings',
    progress: (t) => clamp01(t.swings / 1000),
  },
  {
    id: '500_THROWS',
    label: '500 Throws',
    icon: '🎽',
    description: '500 career throws to a bag',
    progress: (t) => clamp01(t.throwsMade / 500),
  },
  {
    id: 'BLAST_75',
    label: 'Blast Factor 75',
    icon: '💥',
    description: 'Post a 75 Blast Factor',
    progress: (t) => clamp01(t.bestBlastFactor / 75),
  },
];

export interface AwardStatus {
  def: AwardDef;
  progress: number;
  unlocked: boolean;
}

export function evaluateAwards(
  defs: AwardDef[],
  totals: CareerTotals,
  sessions: Session[],
): AwardStatus[] {
  return defs.map((def) => {
    const progress = clamp01(def.progress(totals, sessions) || 0);
    return { def, progress, unlocked: progress >= 1 };
  });
}

// ---------------------------------------------------------------------------
// PERSONAL BESTS
// ---------------------------------------------------------------------------

/**
 * Which stats in `session` beat everything that player had done before it.
 * `priorSessions` must exclude the session being checked.
 */
export function detectPersonalBests(session: Session, priorSessions: Session[]): PersonalBest[] {
  const prior = computeTotals(priorSessions);
  const bests: PersonalBest[] = [];

  const check = (
    metric: string,
    label: string,
    value: number | undefined,
    previous: number,
    unit: string,
  ) => {
    if (value !== undefined && value > 0 && value > previous) {
      bests.push({ metric, label, value, previous, unit });
    }
  };

  if (session.pitching) {
    check('avgSpeed', 'Average Velo', session.pitching.avgSpeed, prior.bestAvgSpeed, 'mph');
    check('topSpeed', 'Top Velo', session.pitching.topSpeed, prior.bestTopSpeed, 'mph');
  }
  if (session.hitting) {
    check('batSpeed', 'Bat Speed', session.hitting.batSpeed, prior.bestBatSpeed, 'mph');
    check(
      'bestSwing',
      'Hardest Swing',
      session.hitting.bestSwingBatSpeed,
      prior.bestSwing,
      'mph',
    );
    check('peakHandSpeed', 'Hand Speed', session.hitting.peakHandSpeed, prior.bestHandSpeed, 'mph');
    check(
      'onPlaneEfficiency',
      'On Plane Efficiency',
      session.hitting.onPlaneEfficiency,
      prior.bestOnPlane,
      '%',
    );
    check('blastFactor', 'Blast Factor', session.hitting.blastFactor, prior.bestBlastFactor, '');
  }

  // The very first session of a phase isn't a "best" worth celebrating.
  return priorSessions.length === 0 ? [] : bests;
}
