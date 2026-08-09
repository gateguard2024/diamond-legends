import { Goal, MetricId, Phase, Session } from './types';
import { chancesFor } from './fielding';

// ---------------------------------------------------------------------------
// GOALS ENGINE
//
// "Current Avg" is a rolling average of the most recent ROLLING_WINDOW
// sessions that actually contain that metric. Responsive enough that a good
// week moves the needle, stable enough that one bad day doesn't wreck it.
// ---------------------------------------------------------------------------

export const ROLLING_WINDOW = 5;

/**
 * Every new goal is a 10% improvement on the current rolling average.
 * Change this one number to make the ladder steeper or gentler.
 */
export const GOAL_GAIN_PCT = 0.1;

export interface MetricDef {
  id: MetricId;
  label: string;
  short: string;
  unit: string;
  decimals: number;
  /** Which tab this metric belongs under. */
  phase: Phase | 'habit';
  phaseLabel: string;
  from: string; // tailwind gradient start
  to: string; // tailwind gradient end
  text: string;
  /** Value contributed by a single session, or null if not tracked that day. */
  sessionValue: (s: Session) => number | null;
  /** How the window is combined. `max` = "best in the window". */
  aggregate: 'avg' | 'max';
  /** Sensible ceiling so suggestions don't run away. */
  cap: number;
  /** Target used before there's enough data to suggest one. */
  defaultTarget: number;
  /** Computed from the whole history rather than per-session. */
  derived?: boolean;
}

const pitchOK = (s: Session) => s.pitching && s.pitching.totalPitches > 0;
const hitOK = (s: Session) => s.hitting && s.hitting.swings > 0;

export const METRICS: MetricDef[] = [
  {
    id: 'strikePct',
    label: 'Strike Percentage',
    short: 'STRIKE %',
    unit: '%',
    decimals: 0,
    phase: 'pitching',
    phaseLabel: 'Pitching',
    from: 'from-orange-500',
    to: 'to-amber-300',
    text: 'text-orange-300',
    sessionValue: (s) => (pitchOK(s) ? (s.pitching!.strikes / s.pitching!.totalPitches) * 100 : null),
    aggregate: 'avg',
    cap: 85,
    defaultTarget: 55,
  },
  {
    id: 'avgSpeed',
    label: 'Average Pitch Speed',
    short: 'AVG VELO',
    unit: 'mph',
    decimals: 1,
    phase: 'pitching',
    phaseLabel: 'Pitching',
    from: 'from-red-500',
    to: 'to-orange-300',
    text: 'text-red-300',
    sessionValue: (s) => (pitchOK(s) && s.pitching!.avgSpeed > 0 ? s.pitching!.avgSpeed : null),
    aggregate: 'avg',
    cap: 75,
    defaultTarget: 40,
  },
  {
    id: 'topSpeed',
    label: 'Top Pitch Speed',
    short: 'TOP VELO',
    unit: 'mph',
    decimals: 1,
    phase: 'pitching',
    phaseLabel: 'Pitching',
    from: 'from-rose-500',
    to: 'to-pink-300',
    text: 'text-rose-300',
    sessionValue: (s) => (pitchOK(s) && s.pitching!.topSpeed > 0 ? s.pitching!.topSpeed : null),
    aggregate: 'max',
    cap: 80,
    defaultTarget: 45,
  },
  {
    id: 'batSpeed',
    label: 'Bat Speed',
    short: 'BAT SPEED',
    unit: 'mph',
    decimals: 1,
    phase: 'batting',
    phaseLabel: 'Batting',
    from: 'from-yellow-500',
    to: 'to-yellow-200',
    text: 'text-yellow-300',
    sessionValue: (s) => (hitOK(s) && s.hitting!.batSpeed > 0 ? s.hitting!.batSpeed : null),
    aggregate: 'avg',
    cap: 75,
    defaultTarget: 45,
  },
  {
    id: 'onPlaneEfficiency',
    label: 'On Plane Efficiency',
    short: 'ON PLANE',
    unit: '%',
    decimals: 0,
    phase: 'batting',
    phaseLabel: 'Batting',
    from: 'from-lime-500',
    to: 'to-emerald-300',
    text: 'text-lime-300',
    sessionValue: (s) =>
      hitOK(s) && s.hitting!.onPlaneEfficiency > 0 ? s.hitting!.onPlaneEfficiency : null,
    aggregate: 'avg',
    cap: 90,
    defaultTarget: 65,
  },
  {
    id: 'cleanPct',
    label: 'Catch / Clean Field Rate',
    short: 'CATCH %',
    unit: '%',
    decimals: 0,
    phase: 'fielding',
    phaseLabel: 'Fielding',
    from: 'from-sky-500',
    to: 'to-cyan-300',
    text: 'text-sky-300',
    sessionValue: (s) => {
      if (!s.fielding) return null;
      const chances = chancesFor(s.fielding);
      return chances > 0 ? (s.fielding.cleanReps / chances) * 100 : null;
    },
    aggregate: 'avg',
    cap: 98,
    defaultTarget: 80,
  },
  {
    id: 'throwAccuracy',
    label: 'Throwing Accuracy',
    short: 'THROW ACC',
    unit: '%',
    decimals: 0,
    phase: 'fielding',
    phaseLabel: 'Fielding',
    from: 'from-teal-500',
    to: 'to-emerald-300',
    text: 'text-teal-300',
    sessionValue: (s) => {
      const made = s.fielding?.throwsMade ?? 0;
      return made > 0 ? ((s.fielding!.throwsAccurate ?? 0) / made) * 100 : null;
    },
    aggregate: 'avg',
    cap: 98,
    defaultTarget: 75,
  },
  {
    id: 'workoutsPerWeek',
    label: 'Workouts Per Week',
    short: 'WORKOUTS/WK',
    unit: '/wk',
    decimals: 1,
    phase: 'habit',
    phaseLabel: 'Habit',
    from: 'from-violet-500',
    to: 'to-fuchsia-300',
    text: 'text-violet-300',
    sessionValue: () => null,
    aggregate: 'avg',
    cap: 6,
    defaultTarget: 3,
    derived: true,
  },
];

export const METRIC_BY_ID: Record<MetricId, MetricDef> = METRICS.reduce(
  (acc, m) => ({ ...acc, [m.id]: m }),
  {} as Record<MetricId, MetricDef>,
);

const round = (n: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

export const formatMetric = (def: MetricDef, value: number | null) =>
  value === null ? '—' : round(value, def.decimals).toFixed(def.decimals);

// ---------------------------------------------------------------------------
// Series + current value
// ---------------------------------------------------------------------------

export interface SeriesPoint {
  label: string;
  date: string;
  value: number;
}

/** Chronological per-session values for a metric (oldest first). */
export function metricSeries(def: MetricDef, sessions: Session[]): SeriesPoint[] {
  if (def.derived) return weeklyWorkoutSeries(sessions);

  return [...sessions]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => ({ session: s, value: def.sessionValue(s) }))
    .filter((r): r is { session: Session; value: number } => r.value !== null)
    .map(({ session, value }) => ({
      label: shortDate(session.date),
      date: session.date,
      value: round(value, def.decimals),
    }));
}

/** Workouts logged in each of the last 8 weeks (oldest first). */
export function weeklyWorkoutSeries(sessions: Session[], today = new Date()): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let w = 7; w >= 0; w--) {
    const end = new Date(today);
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const startIso = iso(start);
    const endIso = iso(end);
    const days = new Set(
      sessions.filter((s) => s.date >= startIso && s.date <= endIso).map((s) => s.date),
    );
    out.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, date: endIso, value: days.size });
  }
  // Drop leading empty weeks so a brand-new player doesn't see a wall of zeros.
  const firstNonZero = out.findIndex((p) => p.value > 0);
  return firstNonZero === -1 ? [] : out.slice(firstNonZero);
}

/** Rolling value over the most recent ROLLING_WINDOW entries. */
export function currentValue(def: MetricDef, sessions: Session[]): number | null {
  const series = metricSeries(def, sessions);
  if (!series.length) return null;

  const window = series.slice(-ROLLING_WINDOW).map((p) => p.value);
  const value =
    def.aggregate === 'max'
      ? Math.max(...window)
      : window.reduce((a, b) => a + b, 0) / window.length;

  return round(value, def.decimals);
}

/** Same window, shifted back one session — powers the up/down delta arrow. */
export function previousValue(def: MetricDef, sessions: Session[]): number | null {
  const series = metricSeries(def, sessions);
  if (series.length < 2) return null;

  const window = series.slice(0, -1).slice(-ROLLING_WINDOW).map((p) => p.value);
  if (!window.length) return null;

  const value =
    def.aggregate === 'max'
      ? Math.max(...window)
      : window.reduce((a, b) => a + b, 0) / window.length;

  return round(value, def.decimals);
}

/** All-time best single session for a metric. */
export function personalBest(def: MetricDef, sessions: Session[]): number | null {
  const series = metricSeries(def, sessions);
  return series.length ? Math.max(...series.map((p) => p.value)) : null;
}

/** How many sessions of data back the current value. */
export function sampleSize(def: MetricDef, sessions: Session[]): number {
  return Math.min(ROLLING_WINDOW, metricSeries(def, sessions).length);
}

// ---------------------------------------------------------------------------
// Goal progress + suggestions
// ---------------------------------------------------------------------------

export interface GoalProgress {
  def: MetricDef;
  goal: Goal | null;
  current: number | null;
  previous: number | null;
  best: number | null;
  samples: number;
  /** 0..1 from the value when the goal was set to the target. */
  progress: number;
  achieved: boolean;
  remaining: number | null;
}

export function goalProgress(def: MetricDef, goal: Goal | null, sessions: Session[]): GoalProgress {
  const current = currentValue(def, sessions);
  const previous = previousValue(def, sessions);
  const best = personalBest(def, sessions);
  const samples = sampleSize(def, sessions);

  let progress = 0;
  let achieved = false;
  let remaining: number | null = null;

  if (goal && current !== null) {
    const span = goal.target - goal.startValue;
    progress = span <= 0 ? (current >= goal.target ? 1 : 0) : (current - goal.startValue) / span;
    progress = Math.max(0, Math.min(1, progress));
    achieved = current >= goal.target;
    remaining = round(Math.max(0, goal.target - current), def.decimals);
  }

  return { def, goal, current, previous, best, samples, progress, achieved, remaining };
}

/**
 * A 10% gain on `base`, floored at the metric's minimum meaningful step and
 * ceilinged at its cap. Rounding is done at the metric's own precision, so a
 * 10% gain that would disappear into rounding still moves by one step.
 */
export function targetFromBase(def: MetricDef, base: number): number {
  if (base <= 0) return def.defaultTarget;

  // 10% better than where they are now.
  let target = round(base * (1 + GOAL_GAIN_PCT), def.decimals);

  // If rounding swallowed the gain, nudge it up by one unit of precision so
  // the goal is always strictly harder than the current average.
  const smallestStep = 10 ** -def.decimals;
  if (target <= base) target = round(base + smallestStep, def.decimals);

  return round(Math.min(def.cap, target), def.decimals);
}

/**
 * Next target to propose after a goal is cleared. Built off whichever is
 * higher — the average they just posted, or the goal they just beat — so the
 * ladder always moves up, never sideways.
 */
export function suggestNextTarget(
  def: MetricDef,
  sessions: Session[],
  clearedTarget?: number,
): number {
  const current = currentValue(def, sessions);
  const base = Math.max(current ?? 0, clearedTarget ?? 0);
  return targetFromBase(def, base);
}

/** Target for a metric that has never had a goal: 10% over today's average. */
export function initialTarget(def: MetricDef, sessions: Session[]): number {
  const current = currentValue(def, sessions);
  if (current === null || current <= 0) return def.defaultTarget;
  return targetFromBase(def, current);
}

/** Active goal for a metric, if any. */
export function activeGoal(goals: Goal[], playerId: string, metric: MetricId): Goal | null {
  return (
    goals.find((g) => g.playerId === playerId && g.metric === metric && !g.achievedAt) ?? null
  );
}

/** Cleared goals, newest first — the player's trophy shelf. */
export function achievedGoals(goals: Goal[], playerId: string): Goal[] {
  return goals
    .filter((g) => g.playerId === playerId && g.achievedAt)
    .sort((a, b) => (a.achievedAt! < b.achievedAt! ? 1 : -1));
}

// ---------------------------------------------------------------------------

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function shortDate(isoDate: string) {
  const [, m, d] = isoDate.split('-');
  return `${Number(m)}/${Number(d)}`;
}
