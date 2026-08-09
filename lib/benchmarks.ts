import { MetricId, Phase } from './types';

// ---------------------------------------------------------------------------
// LEVEL BENCHMARKS — 9U / 10U
//
// IMPORTANT: these are coaching rules of thumb for 9-10 year olds on a 46-foot
// mound, not official published standards. No governing body publishes
// "AAA requires X mph." They're assembled from travel-ball tryout norms and
// Blast Motion's youth ranges, and they exist so the boys have a concrete
// number to chase.
//
// Every number is editable right here. If your league's AAA runs hotter or
// cooler, change the `aaa` column and the whole app re-scores itself.
// ---------------------------------------------------------------------------

export type LevelId = 'rec' | 'aa' | 'aaa' | 'elite';

export const LEVELS: { id: LevelId; label: string; blurb: string; color: string }[] = [
  { id: 'rec', label: 'Rec', blurb: 'Learning the skill', color: 'text-slate-400' },
  { id: 'aa', label: 'AA', blurb: 'Solid travel-ball player', color: 'text-sky-300' },
  { id: 'aaa', label: 'AAA', blurb: 'The target', color: 'text-amber-300' },
  { id: 'elite', label: 'Elite', blurb: 'Top of the age group', color: 'text-fuchsia-300' },
];

export interface Benchmark {
  metric: MetricId;
  phase: Phase | 'habit';
  label: string;
  unit: string;
  decimals: number;
  rec: number;
  aa: number;
  aaa: number;
  elite: number;
  /** Plain-language explanation for a 9-year-old. */
  kidNote: string;
}

export const BENCHMARKS: Benchmark[] = [
  // --- Pitching -----------------------------------------------------------
  {
    metric: 'avgSpeed',
    phase: 'pitching',
    label: 'Average Velo',
    unit: 'mph',
    decimals: 1,
    rec: 38,
    aa: 42,
    aaa: 46,
    elite: 50,
    kidNote: 'How hard you throw on a normal pitch, not just your best one.',
  },
  {
    metric: 'topSpeed',
    phase: 'pitching',
    label: 'Top Velo',
    unit: 'mph',
    decimals: 1,
    rec: 42,
    aa: 46,
    aaa: 50,
    elite: 54,
    kidNote: 'Your hardest pitch of the day.',
  },
  {
    metric: 'strikePct',
    phase: 'pitching',
    label: 'Strike %',
    unit: '%',
    decimals: 0,
    rec: 45,
    aa: 52,
    aaa: 60,
    elite: 67,
    kidNote: 'AAA coaches take strikes over speed every single time.',
  },

  // --- Batting ------------------------------------------------------------
  {
    metric: 'batSpeed',
    phase: 'batting',
    label: 'Bat Speed',
    unit: 'mph',
    decimals: 1,
    rec: 38,
    aa: 43,
    aaa: 48,
    elite: 53,
    kidNote: 'How fast the barrel moves through the zone.',
  },
  {
    metric: 'onPlaneEfficiency',
    phase: 'batting',
    label: 'On Plane Efficiency',
    unit: '%',
    decimals: 0,
    rec: 55,
    aa: 63,
    aaa: 72,
    elite: 80,
    kidNote: 'How long your barrel stays in line with the pitch. Higher = more hard contact.',
  },

  // --- Fielding -----------------------------------------------------------
  {
    metric: 'cleanPct',
    phase: 'fielding',
    label: 'Catch %',
    unit: '%',
    decimals: 0,
    rec: 70,
    aa: 80,
    aaa: 88,
    elite: 94,
    kidNote: 'Out of every ball hit at you, how many you handle cleanly.',
  },
  {
    metric: 'throwAccuracy',
    phase: 'fielding',
    label: 'Throw Accuracy',
    unit: '%',
    decimals: 0,
    rec: 65,
    aa: 75,
    aaa: 85,
    elite: 92,
    kidNote: 'A catch means nothing if the throw pulls the first baseman off the bag.',
  },

  // --- Habit --------------------------------------------------------------
  {
    metric: 'workoutsPerWeek',
    phase: 'habit',
    label: 'Workouts / Week',
    unit: '/wk',
    decimals: 1,
    rec: 1,
    aa: 2,
    aaa: 3,
    elite: 4.5,
    kidNote: 'AAA players train on the days nobody makes them.',
  },
];

export const BENCHMARK_BY_METRIC: Partial<Record<MetricId, Benchmark>> = BENCHMARKS.reduce(
  (acc, b) => ({ ...acc, [b.metric]: b }),
  {},
);

/** Which level a value currently clears. Null means not yet at Rec. */
export function levelFor(b: Benchmark, value: number | null): LevelId | null {
  if (value === null) return null;
  if (value >= b.elite) return 'elite';
  if (value >= b.aaa) return 'aaa';
  if (value >= b.aa) return 'aa';
  if (value >= b.rec) return 'rec';
  return null;
}

/** 0..1 progress from zero-ish toward the AAA line. 1 means AAA or better. */
export function aaaProgress(b: Benchmark, value: number | null): number {
  if (value === null) return 0;
  // Scale from the Rec floor so the bar isn't meaningless at the low end.
  const floor = b.rec * 0.6;
  if (value >= b.aaa) return 1;
  if (value <= floor) return 0;
  return (value - floor) / (b.aaa - floor);
}

/** How much more is needed to hit AAA. 0 means already there. */
export function gapToAAA(b: Benchmark, value: number | null): number {
  if (value === null) return b.aaa;
  return Math.max(0, Number((b.aaa - value).toFixed(b.decimals)));
}

export interface ReadinessResult {
  /** 0..100 — average progress toward AAA across every metric with data. */
  score: number;
  atOrAboveAAA: number;
  tracked: number;
  /** Metrics with data, furthest from AAA first. */
  gaps: { benchmark: Benchmark; value: number; progress: number; gap: number; level: LevelId | null }[];
}

/**
 * "How close are we to AAA?" across a set of current values.
 * Metrics with no data yet are excluded rather than scored as zero.
 */
export function aaaReadiness(current: Partial<Record<MetricId, number | null>>): ReadinessResult {
  const rows = BENCHMARKS.map((b) => {
    const value = current[b.metric] ?? null;
    return {
      benchmark: b,
      value: value ?? 0,
      hasData: value !== null && value > 0,
      progress: aaaProgress(b, value),
      gap: gapToAAA(b, value),
      level: levelFor(b, value),
    };
  }).filter((r) => r.hasData);

  const score = rows.length
    ? Math.round((rows.reduce((sum, r) => sum + r.progress, 0) / rows.length) * 100)
    : 0;

  return {
    score,
    atOrAboveAAA: rows.filter((r) => r.progress >= 1).length,
    tracked: rows.length,
    gaps: rows
      .sort((a, b) => a.progress - b.progress)
      .map(({ benchmark, value, progress, gap, level }) => ({
        benchmark,
        value,
        progress,
        gap,
        level,
      })),
  };
}
